package com.examquizai.backend.repository.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-subject attempt totals, produced by joining {@code quizAttempts} to
 * {@code quizzes} (via {@code $lookup} on {@code quizId}) and grouping by
 * {@code quiz.subject}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectStats {

    /**
     * Null if the source quiz's subject was never set.
     */
    private String subject;

    private long attemptCount;

    private double totalScore;

    private double totalMaxScore;
}
