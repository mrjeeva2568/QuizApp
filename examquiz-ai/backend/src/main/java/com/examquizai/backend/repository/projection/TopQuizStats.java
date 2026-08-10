package com.examquizai.backend.repository.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Attempt totals for a single quiz, used to rank the most-attempted quizzes
 * on the analytics endpoint. {@code quizTitle} is read directly off
 * {@code QuizAttempt.quizTitle} (already denormalized there) rather than via
 * a join, since it's cheaper and the field is already present.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopQuizStats {

    private String quizId;

    private String quizTitle;

    private long attemptCount;

    private double totalScore;

    private double totalMaxScore;
}
