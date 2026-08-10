package com.examquizai.backend.repository.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Overall (platform-wide) score totals across all EVALUATED attempts, used to
 * compute a single weighted average score percentage: {@code totalScore / totalMaxScore * 100}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScoreSummary {

    private long totalAttempts;

    private double totalScore;

    private double totalMaxScore;
}
