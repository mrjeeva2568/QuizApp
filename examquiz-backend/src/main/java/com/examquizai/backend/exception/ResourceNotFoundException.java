package com.examquizai.backend.exception;

/**
 * Thrown when a requested resource (user, quiz, exam, etc.) cannot be found.
 * Mapped to HTTP 404 by {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super("%s not found with %s = '%s'".formatted(resourceName, fieldName, fieldValue));
    }
}
