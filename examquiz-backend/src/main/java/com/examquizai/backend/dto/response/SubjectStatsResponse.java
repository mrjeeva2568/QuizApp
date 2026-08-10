package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Attempt totals for one quiz subject.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectStatsResponse {

    private String subject;

    private long attemptCount;

    /**
     * Weighted average score for this subject, as a percentage.
     */
    private Double averageScorePercentage;
}
