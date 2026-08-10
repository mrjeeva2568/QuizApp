package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One bucket of the score-distribution histogram (e.g. "60-79" -> 14 attempts).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreBucketResponse {

    private String label;

    private long count;
}
