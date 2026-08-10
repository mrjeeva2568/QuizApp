package com.examquizai.backend.repository.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of a per-student aggregation over {@code quizAttempts} (EVALUATED only).
 * Raw sums, not a percentage — dividing is left to the caller so it can guard
 * the zero-denominator case however fits the context.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttemptStats {

    private String userId;

    private long totalAttempts;

    private double totalScore;

    private double totalMaxScore;
}
