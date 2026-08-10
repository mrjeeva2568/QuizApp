package com.examquizai.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload for answering (or changing the answer to) a single question within
 * an in-progress {@code QuizAttempt}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {

    @NotBlank(message = "questionId is required")
    private String questionId;

    /**
     * Selected option IDs, for single/multi-select questions. May be empty if
     * {@code textAnswer} is used instead.
     */
    private List<String> selectedOptionIds;

    /**
     * Free-text answer, for short-answer/essay-style questions.
     */
    private String textAnswer;
}
