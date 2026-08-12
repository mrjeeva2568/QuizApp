package com.examquizai.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds UiPath Agent integration configuration (prefix: app.uipath.*), which in
 * turn is sourced from environment variables (see application.properties.example).
 *
 * <p>The UiPath agent is invoked via the standard Orchestrator Jobs API
 * (StartJobs + poll GET Jobs({id})) rather than a dedicated synchronous
 * "invoke" endpoint — confirmed against a live serverless Python agent.
 * See {@code UiPathAgentService} for the full request/poll/parse flow.</p>
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
     * Base URL of the Orchestrator instance, WITHOUT a trailing slash
     * (e.g. https://cloud.uipath.com/{org}/{tenant}/orchestrator_).
     * Jobs endpoints are built as {@code baseUrl + "/odata/Jobs/..."}.
     */
    private String baseUrl;

    /**
     * OAuth2 client-credentials token endpoint (UiPath Identity Server), e.g.
     * https://cloud.uipath.com/{org}/identity_/connect/token.
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
     * OAuth2 scope requested during token acquisition, if applicable
     * (e.g. "OR.Execution OR.Jobs").
     */
    private String scope;

    /**
     * Orchestrator folder id (numeric OrganizationUnitId) the target process
     * is deployed in. Sent as the X-UIPATH-OrganizationUnitId header on every
     * Orchestrator call — required for folder-scoped (non-classic) tenants.
     */
    private long folderId;

    /**
     * ReleaseKey (GUID) of the published agent process within {@code folderId}.
     * Note this is folder-specific: republishing to a different folder, or a
     * new deployment/version, changes this value — re-fetch it via
     * GET /odata/Releases whenever the agent is redeployed.
     */
    private String releaseKey;

    private long connectTimeoutMs = 5_000;

    private long responseTimeoutMs = 30_000;

    private int maxRetryAttempts = 3;

    private long retryBackoffMs = 500;

    /**
     * How often to poll GET /odata/Jobs({id}) while a job is Pending/Running.
     */
    private long pollIntervalMs = 2_000;

    /**
     * Maximum number of polling attempts before giving up and throwing
     * AiAgentTimeoutException, even if the job hasn't reached a terminal
     * state yet. At the default interval (2s) this is ~2 minutes total -
     * observed real runs take ~15-20s, so this leaves generous headroom.
     */
    private int maxPollAttempts = 60;
}