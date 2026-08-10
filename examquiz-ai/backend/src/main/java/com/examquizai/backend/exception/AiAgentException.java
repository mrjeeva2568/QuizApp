package com.examquizai.backend.exception;

/**
 * Thrown when a call to the external UiPath Agentic AI service fails.
 * Base type of the UiPath integration exception family — see
 * {@link AiAgentAuthenticationException}, {@link AiAgentTimeoutException}, and
 * {@link AiAgentValidationException} for the more specific cases.
 * Mapped to HTTP 502 by {@link GlobalExceptionHandler} unless a subclass overrides that.
 */
public class AiAgentException extends RuntimeException {

    public AiAgentException(String message) {
        super(message);
    }

    public AiAgentException(String message, Throwable cause) {
        super(message, cause);
    }
}
