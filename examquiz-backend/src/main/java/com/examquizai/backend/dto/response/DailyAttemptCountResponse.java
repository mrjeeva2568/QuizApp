package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Attempt count for a single day, used for the attempts-over-time trend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttemptCountResponse {

    /**
     * ISO date, yyyy-MM-dd (UTC).
     */
    private String date;

    private long count;
}
