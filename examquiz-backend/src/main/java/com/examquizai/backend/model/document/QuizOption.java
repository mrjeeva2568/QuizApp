package com.examquizai.backend.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single answer option belonging to a {@link QuizQuestion}, embedded within {@link Quiz}.
 *
 * <p><b>Sensitive field:</b> {@code correct} must never be serialized into any
 * response returned to a client before that client has submitted an attempt.
 * See {@code QuizOptionPublicResponse} (the pre-submission DTO), which has no
 * {@code correct} field at all — not merely one left null — so there is no
 * accidental-exposure path through that class.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizOption {

    /**
     * Stable identifier, generated at quiz-creation time, used to correlate a
     * student's selection back to this option when an attempt is submitted.
     */
    private String id;

    private String text;

    private boolean correct;
}
