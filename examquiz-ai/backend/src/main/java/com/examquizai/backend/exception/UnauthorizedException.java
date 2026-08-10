package com.examquizai.backend.exception;

/**
 * Thrown when authentication fails or a caller attempts an action without sufficient rights.
 * Mapped to HTTP 401 by {@link GlobalExceptionHandler}.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
