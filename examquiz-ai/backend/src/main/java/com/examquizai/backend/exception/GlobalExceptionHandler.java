package com.examquizai.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

/**
 * Centralized exception handler translating application/framework exceptions
 * into a consistent {@link ErrorResponse} JSON body.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex,
                                                                  HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex,
                                                             HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex,
                                                               HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex,
                                                                 HttpServletRequest request) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password", request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                               HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "You do not have permission to perform this action", request, null);
    }

    @ExceptionHandler(AiAgentTimeoutException.class)
    public ResponseEntity<ErrorResponse> handleAiAgentTimeout(AiAgentTimeoutException ex,
                                                                 HttpServletRequest request) {
        log.error("UiPath AI agent call timed out: {}", ex.getMessage());
        return buildResponse(HttpStatus.GATEWAY_TIMEOUT, ex.getMessage(), request, null);
    }

    @ExceptionHandler(AiAgentAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAiAgentAuthentication(AiAgentAuthenticationException ex,
                                                                        HttpServletRequest request) {
        // Never log ex.getCause() here in a way that could surface secrets/tokens.
        log.error("UiPath AI agent authentication failed: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_GATEWAY, "The AI service is temporarily unavailable", request, null);
    }

    @ExceptionHandler(AiAgentValidationException.class)
    public ResponseEntity<ErrorResponse> handleAiAgentValidation(AiAgentValidationException ex,
                                                                     HttpServletRequest request) {
        log.error("UiPath AI agent returned an invalid response: {}", ex.getMessage());
        return buildResponse(HttpStatus.BAD_GATEWAY, "The AI service returned an unexpected response", request, null);
    }

    @ExceptionHandler(AiAgentException.class)
    public ResponseEntity<ErrorResponse> handleAiAgentException(AiAgentException ex,
                                                                   HttpServletRequest request) {
        log.error("UiPath AI agent call failed", ex);
        return buildResponse(HttpStatus.BAD_GATEWAY, ex.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex,
                                                                   HttpServletRequest request) {
        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        return buildResponse(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex,
                                                                   HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request, null);
    }

    private ErrorResponse.FieldError toFieldError(FieldError fieldError) {
        return ErrorResponse.FieldError.builder()
                .field(fieldError.getField())
                .message(fieldError.getDefaultMessage())
                .build();
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status,
                                                          String message,
                                                          HttpServletRequest request,
                                                          List<ErrorResponse.FieldError> fieldErrors) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .fieldErrors(fieldErrors)
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
