package com.examquizai.backend.service;

import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.request.SubmitQuizAttemptRequest;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.QuizAttemptResponse;
import com.examquizai.backend.dto.response.QuizResponse;

/**
 * Service interface for quiz generation, retrieval,
 * submission, grading and attempt history.
 */
public interface QuizService {

    /**
     * Generates a new quiz using the UiPath AI Agent
     * and saves it to the database.
     *
     * @param request quiz generation parameters
     * @param requesterEmail email of the authenticated user
     * @return generated quiz without exposing correct answers
     */
    QuizResponse generateQuiz(
            QuizGenerationRequest request,
            String requesterEmail
    );

    /**
     * Retrieves a quiz by its ID.
     *
     * <p>
     * Correct answers are not exposed while the student
     * is taking the quiz.
     * </p>
     *
     * @param quizId quiz ID
     * @return quiz information
     */
    QuizResponse getQuizById(
            String quizId
    );

    /**
     * Submits a quiz attempt and evaluates the answers.
     *
     * <p>
     * The returned response contains the evaluation,
     * score and correct answers for the submitted attempt.
     * </p>
     *
     * @param quizId quiz ID
     * @param request submitted answers
     * @param requesterEmail email of the authenticated user
     * @return evaluated quiz attempt
     */
    QuizAttemptResponse submitQuiz(
            String quizId,
            SubmitQuizAttemptRequest request,
            String requesterEmail
    );

    /**
     * Retrieves the authenticated user's quiz attempt history.
     *
     * @param requesterEmail email of the authenticated user
     * @param page page number, starting from 0
     * @param size number of records per page
     * @return paginated quiz attempt history
     */
    PageResponse getHistory(
            String requesterEmail,
            int page,
            int size
    );
}