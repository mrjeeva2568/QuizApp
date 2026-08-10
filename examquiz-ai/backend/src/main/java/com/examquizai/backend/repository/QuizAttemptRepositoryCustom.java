package com.examquizai.backend.repository;

import com.examquizai.backend.repository.projection.DailyAttemptCount;
import com.examquizai.backend.repository.projection.ScoreSummary;
import com.examquizai.backend.repository.projection.StudentAttemptStats;
import com.examquizai.backend.repository.projection.SubjectStats;
import com.examquizai.backend.repository.projection.TopQuizStats;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Custom (non-derivable) query fragment for {@link QuizAttemptRepository},
 * covering the aggregation pipelines behind the admin dashboard/analytics
 * endpoints. None of these have a clean method-name-derivation equivalent —
 * they group, join, and bucket, which is squarely aggregation-pipeline territory.
 */
public interface QuizAttemptRepositoryCustom {

    /**
     * Per-student EVALUATED-attempt totals for a bounded batch of user ids
     * (e.g. one page of the student list) — a single aggregation rather than
     * one query per student.
     */
    Map<String, StudentAttemptStats> aggregateStatsByUserIds(Collection<String> userIds);

    /**
     * Platform-wide EVALUATED-attempt score totals, for the dashboard's overall average.
     */
    ScoreSummary aggregateOverallScoreSummary();

    /**
     * Attempt counts bucketed into fixed score-percentage ranges
     * (0-19, 20-39, 40-59, 60-79, 80-99, 100), zero-filled so every bucket is
     * always present in the result regardless of whether any attempts fall in it.
     */
    Map<String, Long> aggregateScoreDistribution();

    /**
     * Attempt totals grouped by the source quiz's subject, joined via
     * {@code $lookup} against the {@code quizzes} collection.
     */
    List<SubjectStats> aggregateSubjectBreakdown();

    /**
     * Attempt counts per calendar day (UTC) over the last {@code days} days, oldest first.
     */
    List<DailyAttemptCount> aggregateAttemptsOverTime(int days);

    /**
     * The {@code limit} most-attempted quizzes, ranked by attempt count descending.
     */
    List<TopQuizStats> aggregateTopQuizzes(int limit);
}
