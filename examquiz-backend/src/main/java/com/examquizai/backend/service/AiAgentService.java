package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.response.QuizGenerationResponse;

/**
 * Integration boundary for the external UiPath Agentic AI service.
 *
 * <p>
 * This service receives the complete quiz-generation request from the
 * application and sends it to the UiPath Agentic AI service.
 *
 * <p>
 * Quiz generation flow:
 *
 * <pre>
 * Entrance Exam
 *       ↓
 * Subject
 *       ↓
 * Topic
 *       ↓
 * Difficulty
 *       ↓
 * Question Type
 *       ↓
 * Number of Questions
 *       ↓
 * UiPath Agent
 *       ↓
 * Generated Questions
 * </pre>
 */
public interface AiAgentService {

    /**
     * Requests a new AI-generated quiz from the UiPath Agent.
     *
     * <p>
     * The request contains:
     * <ul>
     *     <li>Entrance exam</li>
     *     <li>Subject</li>
     *     <li>Topic</li>
     *     <li>Difficulty</li>
     *     <li>Number of questions</li>
     *     <li>Question type</li>
     *     <li>Additional instructions</li>
     *     <li>Language</li>
     * </ul>
     *
     * @param request complete quiz generation request
     * @return generated quiz parsed into {@link QuizGenerationResponse}
     *
     * @throws com.examquizai.backend.exception.AiAgentException
     *         if the UiPath Agent call fails, times out, or returns
     *         an invalid response
     */
    QuizGenerationResponse generateQuiz(
            QuizGenerationRequest request
    );
}