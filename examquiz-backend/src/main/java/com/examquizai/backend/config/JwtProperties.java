package com.examquizai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds JWT-related configuration from application.properties (prefix: app.jwt.*).
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Base64-encoded secret key used to sign JWT tokens (HS256, min 256 bits).
     */
    private String secret;

    /**
     * Access token validity in milliseconds.
     */
    private long accessTokenExpirationMs;

    /**
     * Refresh token validity in milliseconds.
     */
    private long refreshTokenExpirationMs;

    /**
     * JWT issuer claim.
     */
    private String issuer;
}
