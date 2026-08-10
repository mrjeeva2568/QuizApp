package com.examquizai.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proxy endpoints for the external UiPath Agentic AI service.
 *
 * <p><b>Placeholder for future implementation.</b> The AI agent is already built in
 * UiPath and is out of scope here; this controller will only forward requests to
 * {@code AiAgentService} once implemented. Not implemented yet.</p>
 */
@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Agent", description = "Not yet implemented - proxies to external UiPath Agentic AI")
public class AiAgentController {
    // TODO: implement endpoints that delegate to AiAgentService in a future iteration
}
