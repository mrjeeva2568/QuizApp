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
 * Integration layer that calls the existing UiPath Agent over REST to generate
 * quiz content. This class owns every cross-cutting concern for that call:
 * authentication (with token caching), connect/response timeouts, retry with
 * backoff on transient failures, and validation of the returned JSON before
 * it is trusted and mapped into {@link QuizGenerationResponse}.
 *
 * <p><b>Never logs or exposes secrets:</b> the client secret / static API key
 * is never written to logs, never included in an exception message, and never
 * echoed back through any response. Only status codes and generic descriptions
 * surface on authentication failures.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UiPathAgentService implements AiAgentService {

    private static final String OAUTH_GRANT_TYPE = "client_credentials";

    private final WebClient uiPathWebClient;
    private final UiPathProperties properties;
    private final ObjectMapper objectMapper;

    /**
     * In-memory cache for the current access token, avoiding a re-authentication
     * round trip on every single quiz-generation call.
     */
    private final AtomicReference<CachedToken> tokenCache = new AtomicReference<>();

    @Override
    public QuizGenerationResponse generateQuiz(QuizGenerationRequest request) {
        Objects.requireNonNull(request, "QuizGenerationRequest must not be null");

        Duration overallTimeout = Duration.ofMillis(properties.getResponseTimeoutMs())
                .multipliedBy(properties.getMaxRetryAttempts() + 1L)
                .plus(Duration.ofMillis(properties.getConnectTimeoutMs()));

        try {
            return getValidAccessToken()
                    .flatMap(token -> callAgent(token, request))
                    .map(this::validateAndParse)
                    .timeout(overallTimeout)
                    .block();
        } catch (AiAgentException ex) {
            // Already the right shape (auth / timeout / validation) - propagate as-is.
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error while generating quiz via the UiPath agent", ex);
            throw new AiAgentException("Failed to generate quiz via the UiPath agent", ex);
        }
    }

    // =========================================================================
    // Authentication
    // =========================================================================

    private Mono<String> getValidAccessToken() {
        CachedToken cached = tokenCache.get();
        if (cached != null && cached.isValid()) {
            return Mono.just(cached.accessToken());
        }

        if (!StringUtils.hasText(properties.getTokenUrl())) {
            // Static API key mode: the configured secret IS the bearer token,
            // no separate OAuth2 exchange is performed.
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
                        // Deliberately do NOT read/forward the response body here - an error
                        // page from an identity provider is not something we want to log or
                        // surface, and it must never end up embedding request context.
                        Mono.error(new AiAgentAuthenticationException(
                                "UiPath authentication failed with status " + response.statusCode())))
                .bodyToMono(JsonNode.class)
                .timeout(Duration.ofMillis(properties.getConnectTimeoutMs() + properties.getResponseTimeoutMs()))
                .retryWhen(retrySpec("token acquisition"))
                .map(this::toCachedToken);
        // Note: no client_secret, client_id, or token value is ever logged in this method.
    }

    private CachedToken toCachedToken(JsonNode json) {
        if (json == null || !json.hasNonNull("access_token")) {
            throw new AiAgentAuthenticationException("UiPath authentication response did not contain an access_token");
        }
        String accessToken = json.get("access_token").asText();
        long expiresInSeconds = json.hasNonNull("expires_in") ? json.get("expires_in").asLong() : 3600L;
        // Refresh 60s before actual expiry to avoid edge-of-expiry request failures.
        Instant expiresAt = Instant.now().plusSeconds(Math.max(expiresInSeconds - 60, 30));
        return new CachedToken(accessToken, expiresAt);
    }

    // =========================================================================
    // Agent invocation
    // =========================================================================

    private Mono<JsonNode> callAgent(String accessToken, QuizGenerationRequest request) {
        String uri = properties.getBaseUrl() + properties.getAgentEndpoint();

        return uiPathWebClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .headers(headers -> {
                    headers.setBearerAuth(accessToken);
                    if (StringUtils.hasText(properties.getTenantName())) {
                        headers.set("X-UIPATH-TenantName", properties.getTenantName());
                    }
                })
                .bodyValue(toAgentPayload(request))
                .retrieve()
                .onStatus(status -> status.value() == 401 || status.value() == 403, response -> {
                    // The cached token may be stale/revoked - drop it so the *next* call
                    // re-authenticates instead of repeating the same failure.
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
                .retryWhen(retrySpec("agent invocation"));
    }

    private Map<String, Object> toAgentPayload(QuizGenerationRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("topic", request.getTopic());
        payload.put("subject", request.getSubject());
        payload.put("difficulty", request.getDifficulty() != null ? request.getDifficulty().name() : null);
        payload.put("numberOfQuestions", request.getNumberOfQuestions());
        payload.put("questionType", request.getQuestionType() != null ? request.getQuestionType().name() : null);
        payload.put("additionalInstructions", request.getAdditionalInstructions());
        payload.put("language", request.getLanguage());
        return payload;
    }

    // =========================================================================
    // Response validation + JSON -> DTO conversion
    // =========================================================================

    private QuizGenerationResponse validateAndParse(JsonNode json) {
        if (json == null || json.isNull() || json.isMissingNode()) {
            throw new AiAgentValidationException("UiPath agent returned an empty response");
        }
        if (!json.hasNonNull("quizTitle") || !StringUtils.hasText(json.get("quizTitle").asText())) {
            throw new AiAgentValidationException("UiPath agent response is missing a required 'quizTitle' field");
        }
        if (!json.has("questions") || !json.get("questions").isArray() || json.get("questions").isEmpty()) {
            throw new AiAgentValidationException("UiPath agent response is missing a non-empty 'questions' array");
        }
        for (JsonNode question : json.get("questions")) {
            if (!question.hasNonNull("questionText") || !StringUtils.hasText(question.get("questionText").asText())) {
                throw new AiAgentValidationException(
                        "One or more questions in the UiPath agent response is missing 'questionText'");
            }
        }

        try {
            QuizGenerationResponse response = objectMapper.treeToValue(json, QuizGenerationResponse.class);
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
    // Retry policy
    // =========================================================================

    private Retry retrySpec(String operationName) {
        return Retry.backoff(properties.getMaxRetryAttempts(), Duration.ofMillis(properties.getRetryBackoffMs()))
                .maxBackoff(Duration.ofSeconds(10))
                .filter(this::isRetryable)
                .doBeforeRetry(signal -> log.warn(
                        "Retrying UiPath {} (attempt {}/{}) after failure: {}",
                        operationName,
                        signal.totalRetries() + 1,
                        properties.getMaxRetryAttempts(),
                        signal.failure().getClass().getSimpleName()))
                .onRetryExhaustedThrow((retryBackoffSpec, signal) -> new AiAgentTimeoutException(
                        "UiPath " + operationName + " failed after " + properties.getMaxRetryAttempts()
                                + " retr" + (properties.getMaxRetryAttempts() == 1 ? "y" : "ies"),
                        signal.failure()));
    }

    /**
     * Only transient, potentially-recoverable failures are retried. Authentication
     * failures are never retried with the same credentials (won't help), and 4xx
     * client errors from the agent (bad request shape) are not retried either.
     */
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
        // Network-level failures: DNS resolution, connection refused, connection reset, etc.
        return throwable instanceof WebClientRequestException;
    }

    /**
     * Cached OAuth2 access token with its expiry. Never logged or exposed.
     */
    private record CachedToken(String accessToken, Instant expiresAt) {
        boolean isValid() {
            return accessToken != null && expiresAt != null && Instant.now().isBefore(expiresAt);
        }
    }
}
