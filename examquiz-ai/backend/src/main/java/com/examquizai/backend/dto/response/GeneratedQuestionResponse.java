package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * A single AI-generated question within a {@link QuizGenerationResponse}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestionResponse {

    private String questionText;

    private QuestionType questionType;

    /**
     * Populated for MULTIPLE_CHOICE / TRUE_FALSE. Empty for SHORT_ANSWER.
     */
    @Builder.Default
    private List<GeneratedOptionResponse> options = new ArrayList<>();

    /**
     * Populated for SHORT_ANSWER questions only.
     */
    private String correctAnswer;

    /**
     * Optional rationale the agent provided for the correct answer.
     */
    private String explanation;

    @Builder.Default
    private double points = 1.0;
}
