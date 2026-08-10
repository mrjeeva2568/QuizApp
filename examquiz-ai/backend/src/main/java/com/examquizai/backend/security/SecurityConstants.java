package com.examquizai.backend.security;

/**
 * Shared constants for the security/JWT layer.
 */
public final class SecurityConstants {

    private SecurityConstants() {
    }

    public static final String AUTH_HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_USER_ID = "userId";

    /**
     * Endpoints reachable without a valid JWT.
     */
    public static final String[] PUBLIC_ENDPOINTS = {
            "/api/v1/auth/**",
            "/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/actuator/health",
            "/actuator/info"
    };
}
