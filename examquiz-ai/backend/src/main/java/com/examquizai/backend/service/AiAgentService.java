package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.response.QuizGenerationResponse;

/**
 * Integration boundary for the external UiPath Agentic AI service.
 *
 * <p>The AI agent itself is already built and hosted in UiPath; this service
 * only calls it over REST and adapts the result into application DTOs. See
 * {@code UiPathAgentService} for the concrete implementation (authentication,
 * timeout, retry, and response validation).</p>
 */
public interface AiAgentService {

    /**
     * Requests a new AI-generated quiz from the UiPath agent.
     *
     * @param request generation parameters (topic, difficulty, question count, etc.)
     * @return the generated quiz, parsed and validated from the agent's response
     * @throws com.examquizai.backend.exception.AiAgentException if the call fails,
     *         times out (after retries), or the agent's response is invalid
     */
    QuizGenerationResponse generateQuiz(QuizGenerationRequest request);
}
