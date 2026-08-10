package com.examquizai.backend.service.impl;

import com.examquizai.backend.dto.response.AdminAnalyticsResponse;
import com.examquizai.backend.dto.response.AdminDashboardResponse;
import com.examquizai.backend.dto.response.DailyAttemptCountResponse;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.RecentAttemptResponse;
import com.examquizai.backend.dto.response.ScoreBucketResponse;
import com.examquizai.backend.dto.response.StudentSummaryResponse;
import com.examquizai.backend.dto.response.SubjectStatsResponse;
import com.examquizai.backend.dto.response.TopQuizResponse;
import com.examquizai.backend.exception.BadRequestException;
import com.examquizai.backend.exception.ResourceNotFoundException;
import com.examquizai.backend.model.document.QuizAttempt;
import com.examquizai.backend.model.document.User;
import com.examquizai.backend.model.enums.AttemptStatus;
import com.examquizai.backend.model.enums.Role;
import com.examquizai.backend.repository.QuizAttemptRepository;
import com.examquizai.backend.repository.QuizRepository;
import com.examquizai.backend.repository.UserRepository;
import com.examquizai.backend.repository.projection.DailyAttemptCount;
import com.examquizai.backend.repository.projection.ScoreSummary;
import com.examquizai.backend.repository.projection.StudentAttemptStats;
import com.examquizai.backend.repository.projection.SubjectStats;
import com.examquizai.backend.repository.projection.TopQuizStats;
import com.examquizai.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Implements the admin dashboard, student management, and analytics endpoints.
 *
 * <p>Every "average score" figure in this class is a <b>weighted</b> average
 * ({@code sum(score) / sum(maxScore) * 100}), computed in Java from raw sums
 * returned by the repository's aggregation pipelines — not an average of
 * per-attempt percentages. This avoids letting a handful of low-question
 * attempts skew the figure the way a naive average-of-percentages would.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private static final int RECENT_ACTIVITY_LIMIT = 5;
    private static final int ANALYTICS_TREND_DAYS = 30;
    private static final int TOP_QUIZZES_LIMIT = 5;

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    // =========================================================================
    // Dashboard
    // =========================================================================

    @Override
    public AdminDashboardResponse getDashboard() {
        long totalStudents = userRepository.countByRolesContaining(Role.STUDENT);
        long activeStudents = userRepository.countByRolesContainingAndEnabled(Role.STUDENT, true);
        long disabledStudents = totalStudents - activeStudents;

        long totalQuizzesGenerated = quizRepository.count();
        long totalAttempts = quizAttemptRepository.count();

        ScoreSummary overall = quizAttemptRepository.aggregateOverallScoreSummary();
        Double averageScorePercentage = computePercentage(overall.getTotalScore(), overall.getTotalMaxScore());

        List<RecentAttemptResponse> recentActivity = buildRecentActivity();

        return AdminDashboardResponse.builder()
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
                .disabledStudents(disabledStudents)
                .totalQuizzesGenerated(totalQuizzesGenerated)
                .totalAttempts(totalAttempts)
                .averageScorePercentage(averageScorePercentage)
                .recentActivity(recentActivity)
                .build();
    }

    private List<RecentAttemptResponse> buildRecentActivity() {
        List<QuizAttempt> recent = quizAttemptRepository
                .findTop10ByStatusOrderBySubmittedAtDesc(AttemptStatus.EVALUATED)
                .stream()
                .limit(RECENT_ACTIVITY_LIMIT)
                .toList();

        if (recent.isEmpty()) {
            return List.of();
        }

        List<String> userIds = recent.stream().map(QuizAttempt::getUserId).distinct().toList();
        Map<String, User> usersById = new LinkedHashMap<>();
        for (User user : userRepository.findAllById(userIds)) {
            usersById.put(user.getId(), user);
        }

        return recent.stream()
                .map(attempt -> {
                    User student = usersById.get(attempt.getUserId());
                    return RecentAttemptResponse.builder()
                            .attemptId(attempt.getId())
                            .studentId(attempt.getUserId())
                            .studentName(student != null ? student.getFullName() : "Unknown student")
                            .studentEmail(student != null ? student.getEmail() : null)
                            .quizId(attempt.getQuizId())
                            .quizTitle(attempt.getQuizTitle())
                            .score(attempt.getScore())
                            .maxScore(attempt.getMaxScore())
                            .submittedAt(attempt.getSubmittedAt())
                            .build();
                })
                .toList();
    }

    // =========================================================================
    // Student management
    // =========================================================================

    @Override
    public PageResponse<StudentSummaryResponse> getStudents(String search, Boolean enabled, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> students = userRepository.searchStudents(search, enabled, pageable);

        List<String> studentIds = students.getContent().stream().map(User::getId).toList();
        Map<String, StudentAttemptStats> statsByUserId = quizAttemptRepository.aggregateStatsByUserIds(studentIds);

        return PageResponse.of(students, user -> toStudentSummary(user, statsByUserId.get(user.getId())));
    }

    @Override
    public StudentSummaryResponse updateStudentStatus(String studentId, boolean enabled) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", studentId));

        if (!student.getRoles().contains(Role.STUDENT)) {
            throw new BadRequestException("Only STUDENT accounts can be managed through this endpoint");
        }

        student.setEnabled(enabled);
        User saved = userRepository.save(student);

        log.info("Student {} {} by admin action", studentId, enabled ? "enabled" : "disabled");

        Map<String, StudentAttemptStats> stats = quizAttemptRepository.aggregateStatsByUserIds(List.of(studentId));
        return toStudentSummary(saved, stats.get(studentId));
    }

    private StudentSummaryResponse toStudentSummary(User user, StudentAttemptStats stats) {
        long totalAttempts = stats != null ? stats.getTotalAttempts() : 0L;
        Double averageScorePercentage = stats != null
                ? computePercentage(stats.getTotalScore(), stats.getTotalMaxScore())
                : null;

        return StudentSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .totalAttempts(totalAttempts)
                .averageScorePercentage(averageScorePercentage)
                .build();
    }

    // =========================================================================
    // Analytics
    // =========================================================================

    @Override
    public AdminAnalyticsResponse getAnalytics() {
        long totalStudents = userRepository.countByRolesContaining(Role.STUDENT);
        long totalQuizzesGenerated = quizRepository.count();
        long totalAttempts = quizAttemptRepository.count();

        ScoreSummary overall = quizAttemptRepository.aggregateOverallScoreSummary();
        Double averageScorePercentage = computePercentage(overall.getTotalScore(), overall.getTotalMaxScore());

        List<ScoreBucketResponse> scoreDistribution = quizAttemptRepository.aggregateScoreDistribution()
                .entrySet().stream()
                .map(entry -> ScoreBucketResponse.builder().label(entry.getKey()).count(entry.getValue()).build())
                .toList();

        List<SubjectStatsResponse> subjectBreakdown = quizAttemptRepository.aggregateSubjectBreakdown()
                .stream()
                .map(this::toSubjectStatsResponse)
                .toList();

        List<DailyAttemptCountResponse> attemptsOverTime = quizAttemptRepository
                .aggregateAttemptsOverTime(ANALYTICS_TREND_DAYS)
                .stream()
                .map(this::toDailyAttemptCountResponse)
                .toList();

        List<TopQuizResponse> topQuizzes = quizAttemptRepository.aggregateTopQuizzes(TOP_QUIZZES_LIMIT)
                .stream()
                .map(this::toTopQuizResponse)
                .toList();

        return AdminAnalyticsResponse.builder()
                .totalStudents(totalStudents)
                .totalQuizzesGenerated(totalQuizzesGenerated)
                .totalAttempts(totalAttempts)
                .averageScorePercentage(averageScorePercentage)
                .scoreDistribution(scoreDistribution)
                .subjectBreakdown(subjectBreakdown)
                .attemptsOverTime(attemptsOverTime)
                .topQuizzes(topQuizzes)
                .build();
    }

    private SubjectStatsResponse toSubjectStatsResponse(SubjectStats stats) {
        return SubjectStatsResponse.builder()
                .subject(stats.getSubject() != null ? stats.getSubject() : "Unspecified")
                .attemptCount(stats.getAttemptCount())
                .averageScorePercentage(computePercentage(stats.getTotalScore(), stats.getTotalMaxScore()))
                .build();
    }

    private DailyAttemptCountResponse toDailyAttemptCountResponse(DailyAttemptCount count) {
        return DailyAttemptCountResponse.builder()
                .date(count.getDate())
                .count(count.getCount())
                .build();
    }

    private TopQuizResponse toTopQuizResponse(TopQuizStats stats) {
        return TopQuizResponse.builder()
                .quizId(stats.getQuizId())
                .quizTitle(stats.getQuizTitle())
                .attemptCount(stats.getAttemptCount())
                .averageScorePercentage(computePercentage(stats.getTotalScore(), stats.getTotalMaxScore()))
                .build();
    }

    // =========================================================================
    // Shared
    // =========================================================================

    /**
     * Weighted average as a percentage, rounded to 2 decimal places. Null if
     * there's no denominator to divide by (no evaluated attempts yet).
     */
    private Double computePercentage(double totalScore, double totalMaxScore) {
        if (totalMaxScore <= 0) {
            return null;
        }
        double percentage = (totalScore / totalMaxScore) * 100.0;
        return Math.round(percentage * 100.0) / 100.0;
    }
}
