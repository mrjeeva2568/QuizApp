package com.examquizai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds UiPath Agent integration configuration (prefix: app.uipath.*), which in
 * turn is sourced from environment variables (see application.properties.example).
 *
 * <p><b>Security:</b> {@code clientSecret} must never be logged, returned in an
 * API response, or included in an exception message. Nothing in this class
 * should ever be serialized back to a client.</p>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.uipath")
public class UiPathProperties {

    /**
     * Base URL of the UiPath Agent REST API (e.g. https://cloud.uipath.com/{org}/{tenant}).
     */
    private String baseUrl;

    /**
     * Path appended to {@code baseUrl} that invokes the specific agent
     * (e.g. /agenthub_/api/v1/agents/{agentId}/invoke — adjust to match your
     * actual published agent endpoint).
     */
    private String agentEndpoint;

    /**
     * OAuth2 client-credentials token endpoint (UiPath Identity Server), e.g.
     * https://cloud.uipath.com/identity_/connect/token.
     * <p>If left blank, the integration falls back to treating {@code clientSecret}
     * itself as a static bearer token (API key mode) rather than performing an
     * OAuth2 exchange — useful for setups using a Personal Access Token instead
     * of a registered OAuth application.</p>
     */
    private String tokenUrl;

    private String tenantName;

    private String clientId;

    /**
     * OAuth2 client secret, OR (if {@code tokenUrl} is blank) a static bearer/API key.
     * Sourced only from the UIPATH_CLIENT_SECRET environment variable — never hardcode.
     */
    private String clientSecret;

    /**
     * OAuth2 scope requested during token acquisition, if applicable.
     */
    private String scope;

    private long connectTimeoutMs = 5_000;

    private long responseTimeoutMs = 30_000;

    private int maxRetryAttempts = 3;

    private long retryBackoffMs = 500;
}
