package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Outward-facing representation of a single embedded {@code QuestionAnswer}.
 *
 * <p><b>{@code correctOptionIds}, {@code correctAnswerText}, and {@code explanation}
 * only exist for post-submission responses</b> (i.e. this DTO as embedded in the
 * result of {@code POST /api/quizzes/{id}/submit}). Nothing in the pre-submission
 * flow (quiz generation, {@code GET /api/quizzes/{id}}) constructs or returns this
 * class at all — that flow uses {@link QuizQuestionPublicResponse} instead, which
 * structurally cannot carry these fields.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnswerResponse {

    private String questionId;

    private List<String> selectedOptionIds;

    private String textAnswer;

    /**
     * Null until the attempt has been evaluated - callers should not assume false means incorrect.
     */
    private Boolean correct;

    private Double pointsAwarded;

    private Instant answeredAt;

    /**
     * The actual correct option id(s) for this question. Only ever populated
     * on a post-submission response.
     */
    private List<String> correctOptionIds;

    /**
     * The actual correct free-text answer, for SHORT_ANSWER questions. Only
     * ever populated on a post-submission response.
     */
    private String correctAnswerText;

    /**
     * Optional rationale for the correct answer. Only ever populated on a
     * post-submission response.
     */
    private String explanation;
}
