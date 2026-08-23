package com.examquizai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Binds CORS-related configuration from application.properties (prefix: app.cors.*).
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    /**
     * Comma-separated list of allowed origins (e.g. http://localhost:5173).
     */
    private List<String> allowedOrigins;

    /**
     * Comma-separated list of allowed HTTP methods.
     */
        private List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");

    /**
     * Comma-separated list of allowed headers. "*" allows all.
     */
    private List<String> allowedHeaders;

    /**
     * Whether credentials (cookies, auth headers) are allowed.
     */
    private boolean allowCredentials;

    /**
     * Preflight cache duration in seconds.
     */
    private long maxAge;
}
