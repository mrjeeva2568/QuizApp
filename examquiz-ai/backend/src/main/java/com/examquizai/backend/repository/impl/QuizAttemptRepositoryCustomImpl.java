package com.examquizai.backend.repository.impl;

import com.examquizai.backend.model.enums.AttemptStatus;
import com.examquizai.backend.repository.QuizAttemptRepositoryCustom;
import com.examquizai.backend.repository.projection.DailyAttemptCount;
import com.examquizai.backend.repository.projection.ScoreSummary;
import com.examquizai.backend.repository.projection.StudentAttemptStats;
import com.examquizai.backend.repository.projection.SubjectStats;
import com.examquizai.backend.repository.projection.TopQuizStats;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Implements {@link QuizAttemptRepositoryCustom}. Named
 * {@code QuizAttemptRepositoryCustomImpl} so Spring Data's repository factory
 * wires it in automatically as a fragment of {@code QuizAttemptRepository}.
 *
 * <p><b>Pattern used throughout:</b> every aggregation ends with a
 * {@code $project} that renames MongoDB's {@code _id} (the group key) to a
 * meaningful field name, rather than leaning on the "{@code _id} maps to a
 * field literally named {@code id}" mapping convention — the resulting
 * projection classes read far more clearly ({@code subject}, {@code quizId},
 * {@code date}, ...) than a generically-named {@code id} would.</p>
 */
@Repository
@RequiredArgsConstructor
public class QuizAttemptRepositoryCustomImpl implements QuizAttemptRepositoryCustom {

    private static final String COLLECTION = "quizAttempts";

    /**
     * Score-percentage bucket boundaries (upper-exclusive), matched to
     * {@link #BUCKET_LABELS} by array position.
     */
    private static final double[] BUCKET_BOUNDARIES = {0, 20, 40, 60, 80, 100, 101};
    private static final String[] BUCKET_LABELS = {"0-19", "20-39", "40-59", "60-79", "80-99", "100"};

    private final MongoTemplate mongoTemplate;

    @Override
    public Map<String, StudentAttemptStats> aggregateStatsByUserIds(Collection<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("userId").in(userIds).and("status").is(AttemptStatus.EVALUATED)),
                Aggregation.group("userId")
                        .count().as("totalAttempts")
                        .sum("score").as("totalScore")
                        .sum("maxScore").as("totalMaxScore"),
                Aggregation.project("totalAttempts", "totalScore", "totalMaxScore")
                        .and("_id").as("userId")
        );

        AggregationResults<StudentAttemptStats> results =
                mongoTemplate.aggregate(aggregation, COLLECTION, StudentAttemptStats.class);

        Map<String, StudentAttemptStats> byUserId = new LinkedHashMap<>();
        for (StudentAttemptStats stats : results.getMappedResults()) {
            byUserId.put(stats.getUserId(), stats);
        }
        return byUserId;
    }

    @Override
    public ScoreSummary aggregateOverallScoreSummary() {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(AttemptStatus.EVALUATED)),
                Aggregation.group()
                        .count().as("totalAttempts")
                        .sum("score").as("totalScore")
                        .sum("maxScore").as("totalMaxScore")
        );

        AggregationResults<ScoreSummary> results =
                mongoTemplate.aggregate(aggregation, COLLECTION, ScoreSummary.class);

        ScoreSummary summary = results.getUniqueMappedResult();
        return summary != null ? summary : new ScoreSummary(0, 0.0, 0.0);
    }

    @Override
    public Map<String, Long> aggregateScoreDistribution() {
        // Zero-fill every bucket up front so the response always has all six
        // labels, even if some have no attempts yet - $bucket omits empty buckets.
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (String label : BUCKET_LABELS) {
            distribution.put(label, 0L);
        }

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(AttemptStatus.EVALUATED).and("maxScore").gt(0)),
                Aggregation.project().andExpression("(score / maxScore) * 100").as("percentage"),
                Aggregation.bucket("percentage")
                        .withBoundaries(BUCKET_BOUNDARIES)
                        .withDefaultBucket("other")
                        .andOutputCount().as("count")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, COLLECTION, Document.class);

        for (Document doc : results.getMappedResults()) {
            String label = labelForBucketLowerBound(doc.get("_id"));
            long count = doc.get("count") instanceof Number number ? number.longValue() : 0L;
            if (label != null) {
                distribution.merge(label, count, Long::sum);
            }
            // A non-numeric "_id" here would mean the "other" default bucket fired,
            // which shouldn't happen given boundaries span 0 up to 101 - silently
            // ignored rather than thrown, since a dashboard shouldn't 500 over it.
        }

        return distribution;
    }

    private String labelForBucketLowerBound(Object bucketId) {
        if (!(bucketId instanceof Number number)) {
            return null;
        }
        int lowerBound = number.intValue();
        return switch (lowerBound) {
            case 0 -> "0-19";
            case 20 -> "20-39";
            case 40 -> "40-59";
            case 60 -> "60-79";
            case 80 -> "80-99";
            case 100 -> "100";
            default -> null;
        };
    }

    @Override
    public List<SubjectStats> aggregateSubjectBreakdown() {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(AttemptStatus.EVALUATED)),
                Aggregation.lookup("quizzes", "quizId", "_id", "quiz"),
                Aggregation.unwind("quiz", true),
                Aggregation.project("score", "maxScore").and("quiz.subject").as("subject"),
                Aggregation.group("subject")
                        .count().as("attemptCount")
                        .sum("score").as("totalScore")
                        .sum("maxScore").as("totalMaxScore"),
                Aggregation.project("attemptCount", "totalScore", "totalMaxScore")
                        .and("_id").as("subject"),
                Aggregation.sort(Sort.Direction.DESC, "attemptCount")
        );

        AggregationResults<SubjectStats> results = mongoTemplate.aggregate(aggregation, COLLECTION, SubjectStats.class);
        return results.getMappedResults();
    }

    @Override
    public List<DailyAttemptCount> aggregateAttemptsOverTime(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        // NOTE: this SpEL-string form of $dateToString is the commonly-documented
        // pattern for Spring Data MongoDB, but wasn't verified against a live
        // MongoDB instance in this environment. If it doesn't compile/execute as
        // expected against your Spring Data MongoDB version, the safer fallback
        // is DateOperators.dateOf("createdAt") with the fluent DateToString builder.
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(since)),
                Aggregation.project().andExpression("dateToString('%Y-%m-%d', createdAt)").as("day"),
                Aggregation.group("day").count().as("count"),
                Aggregation.project("count").and("_id").as("date"),
                Aggregation.sort(Sort.Direction.ASC, "date")
        );

        AggregationResults<DailyAttemptCount> results =
                mongoTemplate.aggregate(aggregation, COLLECTION, DailyAttemptCount.class);
        return results.getMappedResults();
    }

    @Override
    public List<TopQuizStats> aggregateTopQuizzes(int limit) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("status").is(AttemptStatus.EVALUATED)),
                Aggregation.group("quizId")
                        // quizTitle is already denormalized on QuizAttempt, so $first here
                        // avoids a $lookup join that aggregateSubjectBreakdown needs but this doesn't.
                        .first("quizTitle").as("quizTitle")
                        .count().as("attemptCount")
                        .sum("score").as("totalScore")
                        .sum("maxScore").as("totalMaxScore"),
                Aggregation.project("quizTitle", "attemptCount", "totalScore", "totalMaxScore")
                        .and("_id").as("quizId"),
                Aggregation.sort(Sort.Direction.DESC, "attemptCount"),
                Aggregation.limit(limit)
        );

        AggregationResults<TopQuizStats> results = mongoTemplate.aggregate(aggregation, COLLECTION, TopQuizStats.class);
        return results.getMappedResults();
    }
}
