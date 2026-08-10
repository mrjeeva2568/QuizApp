package com.examquizai.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload for final submission of a {@code QuizAttempt} — the complete set of
 * answers being submitted for evaluation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitQuizAttemptRequest {

    @NotEmpty(message = "At least one answer is required to submit an attempt")
    @Valid
    private List<SubmitAnswerRequest> answers;
}
