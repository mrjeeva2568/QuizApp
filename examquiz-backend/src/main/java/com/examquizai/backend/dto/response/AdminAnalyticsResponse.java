package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for {@code GET /api/admin/analytics}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsResponse {

    private long totalStudents;

    private long totalQuizzesGenerated;

    private long totalAttempts;

    private Double averageScorePercentage;

    /**
     * Fixed six buckets (0-19 ... 100), always all present, zero-filled where empty.
     */
    private List<ScoreBucketResponse> scoreDistribution;

    private List<SubjectStatsResponse> subjectBreakdown;

    /**
     * Last 30 days, oldest first.
     */
    private List<DailyAttemptCountResponse> attemptsOverTime;

    /**
     * Top 5 quizzes by attempt count, descending.
     */
    private List<TopQuizResponse> topQuizzes;
}
