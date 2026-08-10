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
 * The quiz object returned by {@code UiPathAgentService#generateQuiz}, parsed
 * and validated from the UiPath agent's JSON response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationResponse {

    private String quizTitle;

    private String description;

    private String subject;

    private DifficultyLevel difficulty;

    private int totalQuestions;

    @Builder.Default
    private List<GeneratedQuestionResponse> questions = new ArrayList<>();

    /**
     * The UiPath agent's own execution/run identifier, kept for traceability
     * in logs and support tickets. Never contains credentials.
     */
    private String agentExecutionId;

    private Instant generatedAt;
}
