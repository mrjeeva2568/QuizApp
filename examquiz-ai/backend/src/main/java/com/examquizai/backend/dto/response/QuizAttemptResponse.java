package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.AttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Outward-facing representation of a {@code QuizAttempt} document.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {

    private String id;

    private String userId;

    private String quizId;

    private String quizTitle;

    private List<QuestionAnswerResponse> answers;

    private int totalQuestions;

    private int correctAnswers;

    private Double score;

    private Double maxScore;

    private AttemptStatus status;

    private Instant startedAt;

    private Instant submittedAt;

    private Long durationSeconds;

    private Instant createdAt;

    private Instant updatedAt;
}
