package com.examquizai.backend.service.impl;

import com.examquizai.backend.config.UiPathProperties;
import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.response.QuizGenerationResponse;
import com.examquizai.backend.exception.AiAgentAuthenticationException;
import com.examquizai.backend.exception.AiAgentException;
import com.examquizai.backend.exception.AiAgentTimeoutException;
import com.examquizai.backend.exception.AiAgentValidationException;
import com.examquizai.backend.service.AiAgentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Integration layer that calls the UiPath Agent via the Orchestrator Jobs API.
 *
 * <p><b>Real contract, confirmed against a live serverless Python agent (not
 * a guessed synchronous "invoke" endpoint):</b>
 * <pre>
 * 1. POST {baseUrl}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
 *      -&gt; { ReleaseKey, Strategy: "ModernJobsCount", JobsCount: 1,
 *           InputArguments: "&lt;json-string&gt;" }
 *      -&gt; returns a Job with Id, State: "Pending"
 * 2. Poll GET {baseUrl}/odata/Jobs({id}) until State is "Successful" or "Faulted"
 * 3. On success, OutputArguments is a JSON *string* whose parsed content is
 *    { "content": { quizTitle, exam, subject, topic, difficulty,
 *                    totalQuestions, questions: [...] } }
 * </pre>
 * Every Orchestrator call requires the X-UIPATH-OrganizationUnitId header set
 * to {@link UiPathProperties#getFolderId()} - folder-scoped tenants reject
 * requests without it (or silently 404 the wrong release/job).
 *
 * <p>The agent's input schema is a Pydantic model requiring exactly:
 * {@code exam, subject, topic, difficulty, questionCount} - note
 * {@code questionCount}, NOT {@code numberOfQuestions}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UiPathAgentService implements AiAgentService {

    private static final String OAUTH_GRANT_TYPE = "client_credentials";
    private static final String ORG_UNIT_HEADER = "X-UIPATH-OrganizationUnitId";

    private final WebClient uiPathWebClient;
    private final UiPathProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * Cached OAuth access token. Never logged or exposed.
     */
    private final AtomicReference<CachedToken> tokenCache = new AtomicReference<>();

    // =========================================================================
    // Generate Quiz (public entry point)
    // =========================================================================

    @Override
    public QuizGenerationResponse generateQuiz(QuizGenerationRequest request) {
        Objects.requireNonNull(request, "QuizGenerationRequest must not be null");

        try {
            return getValidAccessToken()
                    .flatMap(token -> startJob(token, request)
                            .flatMap(jobId -> pollUntilTerminal(token, jobId)))
                    .map(this::extractOutputArguments)
                    .map(this::validateAndParse)
                    .block();

        } catch (AiAgentException ex) {
            // Already the correct application exception.
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while generating quiz via UiPath", ex);
            throw new AiAgentException("Failed to generate quiz via the UiPath agent", ex);
        }
    }

    // =========================================================================
    // Authentication (unchanged - this part was already correct)
    // =========================================================================

    private Mono<String> getValidAccessToken() {
        CachedToken cached = tokenCache.get();
        if (cached != null && cached.isValid()) {
            return Mono.just(cached.accessToken());
        }

        if (!StringUtils.hasText(properties.getTokenUrl())) {
            return Mono.just(properties.getClientSecret());
        }

        return authenticate()
                .doOnNext(tokenCache::set)
                .map(CachedToken::accessToken);
    }

    private Mono<CachedToken> authenticate() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", OAUTH_GRANT_TYPE);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        if (StringUtils.hasText(properties.getScope())) {
            form.add("scope", properties.getScope());
        }

        return uiPathWebClient.post()
                .uri(properties.getTokenUrl())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        Mono.error(new AiAgentAuthenticationException(
                                "UiPath authentication failed with status " + response.statusCode())))
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofMillis(properties.getConnectTimeoutMs() + properties.getResponseTimeoutMs()))
                .retryWhen(retrySpec("token acquisition"))
                .map(this::toCachedToken);
    }

    private CachedToken toCachedToken(JsonNode json) {
        if (json == null || !json.hasNonNull("access_token")) {
            throw new AiAgentAuthenticationException("UiPath authentication response did not contain an access_token");
        }
        String accessToken = json.get("access_token").asText();
        long expiresInSeconds = json.hasNonNull("expires_in") ? json.get("expires_in").asLong() : 3600L;
        Instant expiresAt = Instant.now().plusSeconds(Math.max(expiresInSeconds - 60, 30));
        return new CachedToken(accessToken, expiresAt);
    }

    // =========================================================================
    // Step 1: Start the job
    // =========================================================================

    private Mono<Long> startJob(String accessToken, QuizGenerationRequest request) {
        String uri = properties.getBaseUrl() + "/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs";

        Map<String, Object> startInfo = new LinkedHashMap<>();
        startInfo.put("ReleaseKey", properties.getReleaseKey());
        startInfo.put("Strategy", "ModernJobsCount");
        startInfo.put("JobsCount", 1);
        startInfo.put("InputArguments", toAgentInputJson(request));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("startInfo", startInfo);

        return uiPathWebClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .headers(headers -> applyOrchestratorHeaders(headers, accessToken))
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.value() == 401 || status.value() == 403, response -> {
                    tokenCache.set(null);
                    return Mono.error(new AiAgentAuthenticationException(
                            "UiPath agent rejected the request as unauthorized (status " + response.statusCode() + ")"));
                })
                .onStatus(HttpStatusCode::is4xxClientError, response ->
                        Mono.error(new AiAgentException(
                                "UiPath agent rejected the request (status " + response.statusCode() + ")")))
                .onStatus(HttpStatusCode::is5xxServerError, response ->
                        Mono.error(new AiAgentException(
                                "UiPath agent returned a server error (status " + response.statusCode() + ")")))
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofMillis(properties.getResponseTimeoutMs()))
                .retryWhen(retrySpec("job start"))
                .flatMap(this::extractJobId);
    }

    private Mono<Long> extractJobId(JsonNode startJobsResponse) {
        // StartJobs returns { "value": [ { ..., "Id": 123, ... } ] } for a single job.
        JsonNode valueArray = startJobsResponse != null ? startJobsResponse.get("value") : null;
        if (valueArray == null || !valueArray.isArray() || valueArray.isEmpty()) {
            return Mono.error(new AiAgentValidationException(
                    "UiPath StartJobs response did not contain a job in 'value'"));
        }
        JsonNode job = valueArray.get(0);
        if (!job.hasNonNull("Id")) {
            return Mono.error(new AiAgentValidationException(
                    "UiPath StartJobs response job is missing an 'Id'"));
        }
        return Mono.just(job.get("Id").asLong());
    }

    // =========================================================================
    // Step 2: Poll until the job reaches a terminal state
    // =========================================================================

    private Mono<JsonNode> pollUntilTerminal(String accessToken, long jobId) {
        String uri = properties.getBaseUrl() + "/odata/Jobs(" + jobId + ")";

        Mono<JsonNode> singlePoll = uiPathWebClient.get()
                .uri(uri)
                .headers(headers -> applyOrchestratorHeaders(headers, accessToken))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        Mono.error(new AiAgentException(
                                "Failed to poll UiPath job " + jobId + " (status " + response.statusCode() + ")")))
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofMillis(properties.getResponseTimeoutMs()));

        return singlePoll
                .flatMap(job -> {
                    String state = job.hasNonNull("State") ? job.get("State").asText() : "";
                    if ("Successful".equals(state)) {
                        return Mono.just(job);
                    }
                    if ("Faulted".equals(state) || "Stopped".equals(state)) {
                        String detail = job.has("JobError") && job.get("JobError").hasNonNull("Detail")
                                ? job.get("JobError").get("Detail").asText()
                                : (job.hasNonNull("Info") ? job.get("Info").asText() : "no details provided");
                        return Mono.error(new AiAgentException(
                                "UiPath agent job " + jobId + " ended in state '" + state + "': " + detail));
                    }
                    // Pending / Running - not terminal yet, signal for retry below.
                    return Mono.error(new JobNotTerminalException(state));
                })
                .retryWhen(Retry.fixedDelay(properties.getMaxPollAttempts(), Duration.ofMillis(properties.getPollIntervalMs()))
                        .filter(JobNotTerminalException.class::isInstance)
                        .onRetryExhaustedThrow((spec, signal) -> new AiAgentTimeoutException(
                                "UiPath agent job " + jobId + " did not complete after "
                                        + properties.getMaxPollAttempts() + " polling attempts",
                                signal.failure())));
    }

    /**
     * Internal signal used only to drive the polling retry loop - never
     * surfaced to callers.
     */
    private static final class JobNotTerminalException extends RuntimeException {
        JobNotTerminalException(String state) {
            super("Job not yet terminal, current state: " + state);
        }
    }

    // =========================================================================
    // Step 3: Extract and parse OutputArguments
    // =========================================================================

    /**
     * The completed Job's {@code OutputArguments} field is itself a JSON
     * *string* (mirroring how InputArguments is sent), so it must be parsed
     * a second time. The parsed content is wrapped one level deeper under a
     * "content" key - confirmed against a live successful run.
     */
    private JsonNode extractOutputArguments(JsonNode job) {
        if (!job.hasNonNull("OutputArguments")) {
            throw new AiAgentValidationException("UiPath agent job completed but returned no OutputArguments");
        }

        String outputJson = job.get("OutputArguments").asText();
        JsonNode parsed;
        try {
            parsed = objectMapper.readTree(outputJson);
        } catch (JsonProcessingException ex) {
            throw new AiAgentValidationException(
                    "Could not parse UiPath OutputArguments as JSON: " + ex.getOriginalMessage());
        }

        JsonNode content = parsed.get("content");
        if (content == null || content.isNull()) {
            throw new AiAgentValidationException(
                    "UiPath OutputArguments did not contain the expected 'content' object");
        }
        return content;
    }

    // =========================================================================
    // Build UiPath Input Arguments (as a JSON string, per the API contract)
    // =========================================================================

    /**
     * The agent's Pydantic input schema requires exactly: exam, subject,
     * topic, difficulty, questionCount - confirmed via a live validation
     * error ("5 validation errors for CompleteAgentGraphState"). Note
     * {@code questionCount}, NOT {@code numberOfQuestions} -
     * QuizGenerationRequest keeps its own field name; only the outgoing
     * payload key is remapped here.
     */
    private String toAgentInputJson(QuizGenerationRequest request) {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("exam", request.getExam() != null ? request.getExam().name() : null);
        input.put("subject", request.getSubject());
        input.put("topic", request.getTopic());
        input.put("difficulty", request.getDifficulty() != null ? request.getDifficulty().name() : null);
        input.put("questionCount", request.getNumberOfQuestions());

        try {
            return objectMapper.writeValueAsString(input);
        } catch (JsonProcessingException ex) {
            throw new AiAgentException("Failed to serialize UiPath agent input arguments", ex);
        }
    }

    // =========================================================================
    // Validate and Parse the agent's quiz content into QuizGenerationResponse
    // =========================================================================

    private QuizGenerationResponse validateAndParse(JsonNode content) {
        if (content == null || content.isNull() || content.isMissingNode()) {
            throw new AiAgentValidationException("UiPath agent returned an empty response");
        }

        if (!content.hasNonNull("quizTitle") || !StringUtils.hasText(content.get("quizTitle").asText())) {
            throw new AiAgentValidationException("UiPath agent response is missing a required 'quizTitle' field");
        }

        if (!content.has("questions") || !content.get("questions").isArray() || content.get("questions").isEmpty()) {
            throw new AiAgentValidationException("UiPath agent response is missing a non-empty 'questions' array");
        }

        for (JsonNode question : content.get("questions")) {
            if (!question.hasNonNull("questionText") || !StringUtils.hasText(question.get("questionText").asText())) {
                throw new AiAgentValidationException(
                        "One or more questions in the UiPath agent response is missing 'questionText'");
            }
        }

        try {
            QuizGenerationResponse response = objectMapper.treeToValue(content, QuizGenerationResponse.class);

            if (response.getTotalQuestions() <= 0) {
                response.setTotalQuestions(response.getQuestions().size());
            }
            if (response.getGeneratedAt() == null) {
                response.setGeneratedAt(Instant.now());
            }
            return response;

        } catch (JsonProcessingException ex) {
            throw new AiAgentValidationException(
                    "Failed to map UiPath agent response into QuizGenerationResponse: " + ex.getOriginalMessage());
        }
    }

    // =========================================================================
    // Shared header helper
    // =========================================================================

    private void applyOrchestratorHeaders(org.springframework.http.HttpHeaders headers, String accessToken) {
        headers.setBearerAuth(accessToken);
        headers.set(ORG_UNIT_HEADER, String.valueOf(properties.getFolderId()));
        if (StringUtils.hasText(properties.getTenantName())) {
            headers.set("X-UIPATH-TenantName", properties.getTenantName());
        }
    }

    // =========================================================================
    // Retry Policy (for auth + job-start network calls, not job polling)
    // =========================================================================

    private Retry retrySpec(String operationName) {
        return Retry.backoff(properties.getMaxRetryAttempts(), Duration.ofMillis(properties.getRetryBackoffMs()))
                .maxBackoff(Duration.ofSeconds(10))
                .filter(this::isRetryable)
                .doBeforeRetry(signal -> log.warn(
                        "Retrying UiPath {} (attempt {}/{}) after failure: {}",
                        operationName, signal.totalRetries() + 1, properties.getMaxRetryAttempts(),
                        signal.failure().getClass().getSimpleName()))
                .onRetryExhaustedThrow((retryBackoffSpec, signal) -> new AiAgentTimeoutException(
                        "UiPath " + operationName + " failed after " + properties.getMaxRetryAttempts()
                                + " retr" + (properties.getMaxRetryAttempts() == 1 ? "y" : "ies"),
                        signal.failure()));
    }

    private boolean isRetryable(Throwable throwable) {
        if (throwable instanceof AiAgentAuthenticationException) {
            return false;
        }
        if (throwable instanceof TimeoutException) {
            return true;
        }
        if (throwable instanceof WebClientResponseException webClientResponseException) {
            return webClientResponseException.getStatusCode().is5xxServerError();
        }
        return throwable instanceof WebClientRequestException;
    }

    // =========================================================================
    // Cached Token
    // =========================================================================

    private record CachedToken(String accessToken, Instant expiresAt) {
        boolean isValid() {
            return accessToken != null && expiresAt != null && Instant.now().isBefore(expiresAt);
        }
    }
}