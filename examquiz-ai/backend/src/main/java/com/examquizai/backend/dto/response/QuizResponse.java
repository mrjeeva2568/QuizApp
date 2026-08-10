package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.DifficultyLevel;
import com.examquizai.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Outward-facing, pre-submission representation of a {@code Quiz}. Returned by
 * {@code POST /api/quizzes/generate} and {@code GET /api/quizzes/{id}}.
 *
 * <p>Carries only {@link QuizQuestionPublicResponse} / {@link QuizOptionPublicResponse}
 * questions/options — see those classes for why answer keys cannot leak through them.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {

    private String id;

    private String title;

    private String description;

    private String subject;

    private DifficultyLevel difficulty;

    private QuestionType questionType;

    private int totalQuestions;

    private List<QuizQuestionPublicResponse> questions;

    private Instant createdAt;
}
