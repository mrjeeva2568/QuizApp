package com.examquizai.backend.exception;

/**
 * Thrown when the UiPath agent's response is missing required fields, is
 * structurally invalid JSON, or otherwise cannot be safely mapped into
 * {@code QuizGenerationResponse}.
 */
public class AiAgentValidationException extends AiAgentException {

    public AiAgentValidationException(String message) {
        super(message);
    }

    public AiAgentValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
