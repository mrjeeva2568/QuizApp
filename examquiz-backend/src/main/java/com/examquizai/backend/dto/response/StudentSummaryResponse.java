package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response shape for a single student row, used by both
 * {@code GET /api/admin/students} and {@code PATCH /api/admin/students/{id}/status}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryResponse {

    private String id;

    private String fullName;

    private String email;

    private boolean enabled;

    private Instant createdAt;

    private long totalAttempts;

    /**
     * Weighted average score, as a percentage. Null if the student has no
     * EVALUATED attempts yet.
     */
    private Double averageScorePercentage;
}
