package com.examquizai.backend.dto.request;

import com.examquizai.backend.model.enums.DifficultyLevel;
import com.examquizai.backend.model.enums.QuestionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parameters used to request a new AI-generated quiz from the UiPath agent.
 * This is the request-side contract for {@code UiPathAgentService#generateQuiz}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationRequest {

    @NotBlank(message = "topic is required")
    private String topic;

    /**
     * Broader subject/category the topic falls under (e.g. "Biology" for topic "Photosynthesis").
     */
    private String subject;

    @NotNull(message = "difficulty is required")
    private DifficultyLevel difficulty;

    @Positive(message = "numberOfQuestions must be positive")
    @Max(value = 100, message = "numberOfQuestions must not exceed 100")
    private int numberOfQuestions;

    @NotNull(message = "questionType is required")
    private QuestionType questionType;

    /**
     * Optional free-form guidance passed through to the agent's prompt
     * (e.g. "focus on practical examples", "avoid dates before 1900").
     */
    private String additionalInstructions;

    @Builder.Default
    private String language = "en";
}
