package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response returned by the UiPath Agent after generating a quiz.
 *
 * <p>
 * This class represents the JSON returned by the UiPath Agent
 * and is converted into the application's quiz-generation DTO.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationResponse {

    /**
     * Title of the generated quiz.
     */
    private String quizTitle;

    /**
     * Description of the generated quiz.
     */
    private String description;

    /**
     * Subject for which the quiz was generated.
     */
    private String subject;

    /**
     * Difficulty selected for the quiz.
     */
    private DifficultyLevel difficulty;

    /**
     * Total number of generated questions.
     */
    private int totalQuestions;

    /**
     * Generated questions.
     *
     * <p>
     * Each question contains its text, question type,
     * options, correct answer, explanation and points.
     * </p>
     */
    @Builder.Default
    private List<GeneratedQuestionResponse> questions =
            new ArrayList<>();

    /**
     * UiPath Agent execution/run identifier.
     *
     * <p>
     * Used for traceability and debugging.
     * It must never contain credentials or access tokens.
     * </p>
     */
    private String agentExecutionId;

    /**
     * Time when the quiz was generated.
     */
    private Instant generatedAt;
}