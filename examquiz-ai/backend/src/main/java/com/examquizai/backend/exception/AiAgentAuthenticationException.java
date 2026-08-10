package com.examquizai.backend.exception;

/**
 * Thrown when authenticating with the UiPath agent fails (bad/expired credentials,
 * token endpoint rejected the request, or the agent itself returned 401/403).
 *
 * <p><b>Security note:</b> messages on this exception must never include the
 * client secret, access token, or raw response bodies from the identity
 * endpoint — only status codes and generic descriptions.</p>
 */
public class AiAgentAuthenticationException extends AiAgentException {

    public AiAgentAuthenticationException(String message) {
        super(message);
    }

    public AiAgentAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
