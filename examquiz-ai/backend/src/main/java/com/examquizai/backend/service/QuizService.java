package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.request.SubmitQuizAttemptRequest;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.QuizAttemptResponse;
import com.examquizai.backend.dto.response.QuizAttemptSummaryResponse;
import com.examquizai.backend.dto.response.QuizResponse;

/**
 * Quiz generation, retrieval, submission, and history retrieval.
 *
 * <p><b>Contract:</b> {@link #generateQuiz} and {@link #getQuizById} return
 * {@link QuizResponse}, which structurally cannot carry an answer key.
 * {@link #submitQuiz} is the only method whose response ({@link QuizAttemptResponse})
 * reveals correct answers — and only for the attempt just graded.</p>
 */
public interface QuizService {

    /**
     * Requests a new quiz from the UiPath agent and persists it.
     *
     * @param request           generation parameters
     * @param requesterEmail    email of the authenticated caller (JWT subject)
     * @return the generated quiz, with no answer key exposed
     */
    QuizResponse generateQuiz(QuizGenerationRequest request, String requesterEmail);

    /**
     * Retrieves a quiz for taking it. Never includes correct answers.
     */
    QuizResponse getQuizById(String quizId);

    /**
     * Grades a full set of answers for a quiz in one step and persists the
     * resulting {@code QuizAttempt}. This is the only point at which correct
     * answers are revealed to the caller, and only for the attempt just graded.
     *
     * @param quizId          the quiz being attempted
     * @param request         the student's answers
     * @param requesterEmail  email of the authenticated caller (JWT subject)
     * @return the graded attempt, including correct answers for review
     */
    QuizAttemptResponse submitQuiz(String quizId, SubmitQuizAttemptRequest request, String requesterEmail);

    /**
     * The authenticated caller's quiz attempt history, newest first.
     */
    PageResponse<QuizAttemptSummaryResponse> getHistory(String requesterEmail, int page, int size);
}
