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
 * Integration layer that calls the UiPath Agent over REST.
 *
 * <p>
 * This service handles:
 * <ul>
 *     <li>UiPath authentication</li>
 *     <li>Access-token caching</li>
 *     <li>Timeouts</li>
 *     <li>Retries</li>
 *     <li>Agent request creation</li>
 *     <li>Agent response validation</li>
 *     <li>Mapping the response into QuizGenerationResponse</li>
 * </ul>
 *
 * <p>
 * Quiz generation flow:
 *
 * <pre>
 * Frontend
 *     ↓
 * QuizGenerationRequest
 *     ↓
 * UiPathAgentService
 *     ↓
 * UiPath Agent
 *     ↓
 * QuizGenerationResponse
 * </pre>
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
     * Cached OAuth access token.
     *
     * <p>
     * The token itself is never logged or exposed.
     */
    private final AtomicReference<CachedToken> tokenCache =
            new AtomicReference<>();

    // =========================================================================
    // Generate Quiz
    // =========================================================================

    @Override
    public QuizGenerationResponse generateQuiz(
            QuizGenerationRequest request) {

        Objects.requireNonNull(
                request,
                "QuizGenerationRequest must not be null"
        );

        Duration overallTimeout =
                Duration.ofMillis(properties.getResponseTimeoutMs())
                        .multipliedBy(
                                properties.getMaxRetryAttempts() + 1L
                        )
                        .plus(
                                Duration.ofMillis(
                                        properties.getConnectTimeoutMs()
                                )
                        );

        try {

            return getValidAccessToken()
                    .flatMap(token -> callAgent(token, request))
                    .map(this::validateAndParse)
                    .timeout(overallTimeout)
                    .block();

        } catch (AiAgentException ex) {

            // Already the correct application exception.
            throw ex;

        } catch (Exception ex) {

            log.error(
                    "Unexpected error while generating quiz via UiPath",
                    ex
            );

            throw new AiAgentException(
                    "Failed to generate quiz via the UiPath agent",
                    ex
            );
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

        /*
         * Static API key / bearer-token mode.
         *
         * If tokenUrl is not configured, clientSecret is treated as
         * the configured bearer token.
         */
        if (!StringUtils.hasText(properties.getTokenUrl())) {

            return Mono.just(properties.getClientSecret());
        }

        return authenticate()
                .doOnNext(tokenCache::set)
                .map(CachedToken::accessToken);
    }

    private Mono<CachedToken> authenticate() {

        MultiValueMap<String, String> form =
                new LinkedMultiValueMap<>();

        form.add(
                "grant_type",
                OAUTH_GRANT_TYPE
        );

        form.add(
                "client_id",
                properties.getClientId()
        );

        form.add(
                "client_secret",
                properties.getClientSecret()
        );

        if (StringUtils.hasText(properties.getScope())) {

            form.add(
                    "scope",
                    properties.getScope()
            );
        }

        return uiPathWebClient
                .post()
                .uri(properties.getTokenUrl())
                .contentType(
                        MediaType.APPLICATION_FORM_URLENCODED
                )
                .body(
                        BodyInserters.fromFormData(form)
                )
                .retrieve()

                .onStatus(
                        HttpStatusCode::isError,
                        response ->
                                Mono.error(
                                        new AiAgentAuthenticationException(
                                                "UiPath authentication failed with status "
                                                        + response.statusCode()
                                        )
                                )
                )

                .bodyToMono(JsonNode.class)

                .timeout(
                        Duration.ofMillis(
                                properties.getConnectTimeoutMs()
                                        + properties.getResponseTimeoutMs()
                        )
                )

                .retryWhen(
                        retrySpec("token acquisition")
                )

                .map(this::toCachedToken);
    }

    private CachedToken toCachedToken(
            JsonNode json) {

        if (json == null
                || !json.hasNonNull("access_token")) {

            throw new AiAgentAuthenticationException(
                    "UiPath authentication response did not contain an access_token"
            );
        }

        String accessToken =
                json.get("access_token").asText();

        long expiresInSeconds =
                json.hasNonNull("expires_in")
                        ? json.get("expires_in").asLong()
                        : 3600L;

        /*
         * Refresh 60 seconds before expiry.
         */
        Instant expiresAt =
                Instant.now().plusSeconds(
                        Math.max(
                                expiresInSeconds - 60,
                                30
                        )
                );

        return new CachedToken(
                accessToken,
                expiresAt
        );
    }

    // =========================================================================
    // UiPath Agent Invocation
    // =========================================================================

    private Mono<JsonNode> callAgent(
            String accessToken,
            QuizGenerationRequest request) {

        String uri =
                properties.getBaseUrl()
                        + properties.getAgentEndpoint();

        return uiPathWebClient
                .post()
                .uri(uri)

                .contentType(
                        MediaType.APPLICATION_JSON
                )

                .headers(headers -> {

                    headers.setBearerAuth(
                            accessToken
                    );

                    if (StringUtils.hasText(
                            properties.getTenantName())) {

                        headers.set(
                                "X-UIPATH-TenantName",
                                properties.getTenantName()
                        );
                    }
                })

                /*
                 * This is where the complete quiz request is converted
                 * into the JSON payload sent to UiPath.
                 */
                .bodyValue(
                        toAgentPayload(request)
                )

                .retrieve()

                // -------------------------------------------------------------
                // Authentication errors
                // -------------------------------------------------------------

                .onStatus(
                        status ->
                                status.value() == 401
                                        || status.value() == 403,

                        response -> {

                            /*
                             * Clear the cached token so the next request
                             * authenticates again.
                             */
                            tokenCache.set(null);

                            return Mono.error(
                                    new AiAgentAuthenticationException(
                                            "UiPath agent rejected the request as unauthorized "
                                                    + "(status "
                                                    + response.statusCode()
                                                    + ")"
                                    )
                            );
                        }
                )

                // -------------------------------------------------------------
                // Other 4xx errors
                // -------------------------------------------------------------

                .onStatus(
                        HttpStatusCode::is4xxClientError,

                        response ->
                                Mono.error(
                                        new AiAgentException(
                                                "UiPath agent rejected the request "
                                                        + "(status "
                                                        + response.statusCode()
                                                        + ")"
                                        )
                                )
                )

                // -------------------------------------------------------------
                // 5xx errors
                // -------------------------------------------------------------

                .onStatus(
                        HttpStatusCode::is5xxServerError,

                        response ->
                                Mono.error(
                                        new AiAgentException(
                                                "UiPath agent returned a server error "
                                                        + "(status "
                                                        + response.statusCode()
                                                        + ")"
                                        )
                                )
                )

                .bodyToMono(JsonNode.class)

                .timeout(
                        Duration.ofMillis(
                                properties.getResponseTimeoutMs()
                        )
                )

                .retryWhen(
                        retrySpec("agent invocation")
                );
    }

    // =========================================================================
    // Build UiPath Request Payload
    // =========================================================================

    /**
     * Converts the frontend/backend request into the JSON payload expected
     * by the UiPath Agent.
     *
     * <p>
     * Important:
     *
     * <pre>
     * Exam
     * Subject
     * Topic
     * Difficulty
     * Number of Questions
     * Question Type
     * Additional Instructions
     * Language
     * </pre>
     *
     * are all sent to UiPath.
     */
    private Map<String, Object> toAgentPayload(
            QuizGenerationRequest request) {

        Map<String, Object> payload =
                new LinkedHashMap<>();

        // -------------------------------------------------------------
        // Entrance Exam
        // -------------------------------------------------------------

        payload.put(
                "exam",
                request.getExam() != null
                        ? request.getExam().name()
                        : null
        );

        // -------------------------------------------------------------
        // Subject
        // -------------------------------------------------------------

        payload.put(
                "subject",
                request.getSubject()
        );

        // -------------------------------------------------------------
        // Topic
        // -------------------------------------------------------------

        payload.put(
                "topic",
                request.getTopic()
        );

        // -------------------------------------------------------------
        // Difficulty
        // -------------------------------------------------------------

        payload.put(
                "difficulty",
                request.getDifficulty() != null
                        ? request.getDifficulty().name()
                        : null
        );

        // -------------------------------------------------------------
        // Number of Questions
        // -------------------------------------------------------------

        payload.put(
                "numberOfQuestions",
                request.getNumberOfQuestions()
        );

        // -------------------------------------------------------------
        // Question Type
        // -------------------------------------------------------------

        payload.put(
                "questionType",
                request.getQuestionType() != null
                        ? request.getQuestionType().name()
                        : null
        );

        // -------------------------------------------------------------
        // Additional Instructions
        // -------------------------------------------------------------

        payload.put(
                "additionalInstructions",
                request.getAdditionalInstructions()
        );

        // -------------------------------------------------------------
        // Language
        // -------------------------------------------------------------

        payload.put(
                "language",
                request.getLanguage()
        );

        return payload;
    }

    // =========================================================================
    // Validate and Parse UiPath Response
    // =========================================================================

    private QuizGenerationResponse validateAndParse(
            JsonNode json) {

        if (json == null
                || json.isNull()
                || json.isMissingNode()) {

            throw new AiAgentValidationException(
                    "UiPath agent returned an empty response"
            );
        }

        // -------------------------------------------------------------
        // Validate quiz title
        // -------------------------------------------------------------

        if (!json.hasNonNull("quizTitle")
                || !StringUtils.hasText(
                json.get("quizTitle").asText())) {

            throw new AiAgentValidationException(
                    "UiPath agent response is missing a required 'quizTitle' field"
            );
        }

        // -------------------------------------------------------------
        // Validate questions
        // -------------------------------------------------------------

        if (!json.has("questions")
                || !json.get("questions").isArray()
                || json.get("questions").isEmpty()) {

            throw new AiAgentValidationException(
                    "UiPath agent response is missing a non-empty 'questions' array"
            );
        }

        // -------------------------------------------------------------
        // Validate every question
        // -------------------------------------------------------------

        for (JsonNode question :
                json.get("questions")) {

            if (!question.hasNonNull("questionText")
                    || !StringUtils.hasText(
                    question.get("questionText").asText())) {

                throw new AiAgentValidationException(
                        "One or more questions in the UiPath agent response "
                                + "is missing 'questionText'"
                );
            }
        }

        // -------------------------------------------------------------
        // Convert JSON → QuizGenerationResponse
        // -------------------------------------------------------------

        try {

            QuizGenerationResponse response =
                    objectMapper.treeToValue(
                            json,
                            QuizGenerationResponse.class
                    );

            if (response.getTotalQuestions() <= 0) {

                response.setTotalQuestions(
                        response.getQuestions().size()
                );
            }

            if (response.getGeneratedAt() == null) {

                response.setGeneratedAt(
                        Instant.now()
                );
            }

            return response;

        } catch (JsonProcessingException ex) {

            throw new AiAgentValidationException(
                    "Failed to map UiPath agent response into "
                            + "QuizGenerationResponse: "
                            + ex.getOriginalMessage()
            );
        }
    }

    // =========================================================================
    // Retry Policy
    // =========================================================================

    private Retry retrySpec(
            String operationName) {

        return Retry
                .backoff(
                        properties.getMaxRetryAttempts(),
                        Duration.ofMillis(
                                properties.getRetryBackoffMs()
                        )
                )

                .maxBackoff(
                        Duration.ofSeconds(10)
                )

                .filter(
                        this::isRetryable
                )

                .doBeforeRetry(signal ->
                        log.warn(
                                "Retrying UiPath {} "
                                        + "(attempt {}/{}) "
                                        + "after failure: {}",

                                operationName,

                                signal.totalRetries() + 1,

                                properties.getMaxRetryAttempts(),

                                signal.failure()
                                        .getClass()
                                        .getSimpleName()
                        )
                )

                .onRetryExhaustedThrow(
                        (retryBackoffSpec, signal) ->
                                new AiAgentTimeoutException(
                                        "UiPath "
                                                + operationName
                                                + " failed after "
                                                + properties.getMaxRetryAttempts()
                                                + " retr"
                                                + (
                                                properties.getMaxRetryAttempts()
                                                        == 1
                                                        ? "y"
                                                        : "ies"
                                        ),

                                        signal.failure()
                                )
                );
    }

    /**
     * Determines whether an exception is transient and should be retried.
     */
    private boolean isRetryable(
            Throwable throwable) {

        // Authentication errors should not be retried
        // using the same credentials.
        if (throwable
                instanceof AiAgentAuthenticationException) {

            return false;
        }

        // Timeout → retry
        if (throwable
                instanceof TimeoutException) {

            return true;
        }

        // Server errors → retry
        if (throwable
                instanceof WebClientResponseException
                webClientResponseException) {

            return webClientResponseException
                    .getStatusCode()
                    .is5xxServerError();
        }

        // Network errors → retry
        return throwable
                instanceof WebClientRequestException;
    }

    // =========================================================================
    // Cached Token
    // =========================================================================

    /**
     * Cached OAuth access token.
     *
     * <p>
     * The token is never logged or returned to the frontend.
     */
    private record CachedToken(
            String accessToken,
            Instant expiresAt) {

        boolean isValid() {

            return accessToken != null
                    && expiresAt != null
                    && Instant.now()
                    .isBefore(expiresAt);
        }
    }
}