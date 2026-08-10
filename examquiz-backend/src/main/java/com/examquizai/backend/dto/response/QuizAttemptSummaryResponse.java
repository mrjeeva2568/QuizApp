package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.AttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Slim projection of a {@code QuizAttempt} for list/history views (e.g. "my past
 * attempts"). Deliberately omits the embedded {@code answers} array, which can
 * grow large and isn't needed until a specific attempt is opened in detail via
 * {@link QuizAttemptResponse}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptSummaryResponse {

    private String id;

    private String quizId;

    private String quizTitle;

    private int totalQuestions;

    private int correctAnswers;

    private Double score;

    private Double maxScore;

    private AttemptStatus status;

    private Instant startedAt;

    private Instant submittedAt;

    private Long durationSeconds;
}
