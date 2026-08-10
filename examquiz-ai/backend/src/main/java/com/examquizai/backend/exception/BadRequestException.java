package com.examquizai.backend.exception;

/**
 * Thrown for malformed or semantically invalid client requests (e.g. duplicate email on register).
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
