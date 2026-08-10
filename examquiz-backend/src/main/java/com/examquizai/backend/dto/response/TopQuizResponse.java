package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One entry in the "most-attempted quizzes" ranking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopQuizResponse {

    private String quizId;

    private String quizTitle;

    private long attemptCount;

    private Double averageScorePercentage;
}
