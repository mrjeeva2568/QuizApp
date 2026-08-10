package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for {@code GET /api/admin/dashboard} — a high-level snapshot for
 * the admin landing page.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalStudents;

    private long activeStudents;

    private long disabledStudents;

    private long totalQuizzesGenerated;

    private long totalAttempts;

    /**
     * Platform-wide weighted average score, as a percentage. Null if no
     * EVALUATED attempts exist yet.
     */
    private Double averageScorePercentage;

    private List<RecentAttemptResponse> recentActivity;
}
