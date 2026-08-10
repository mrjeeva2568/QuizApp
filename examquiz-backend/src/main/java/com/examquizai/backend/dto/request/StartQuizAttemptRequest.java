package com.examquizai.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload to begin a new {@code QuizAttempt}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartQuizAttemptRequest {

    @NotBlank(message = "quizId is required")
    private String quizId;
}
