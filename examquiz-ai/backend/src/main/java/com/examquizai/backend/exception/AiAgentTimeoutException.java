package com.examquizai.backend.exception;

/**
 * Thrown when a call to the UiPath agent (or its identity endpoint) does not
 * complete within the configured timeout, including after all retry attempts
 * have been exhausted.
 */
public class AiAgentTimeoutException extends AiAgentException {

    public AiAgentTimeoutException(String message) {
        super(message);
    }

    public AiAgentTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
