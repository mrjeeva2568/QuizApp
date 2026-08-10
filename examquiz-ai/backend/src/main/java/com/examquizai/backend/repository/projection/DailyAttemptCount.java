package com.examquizai.backend.repository.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Attempt count for a single calendar day (yyyy-MM-dd, UTC), used for the
 * attempts-over-time trend on the analytics endpoint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyAttemptCount {

    private String date;

    private long count;
}
