package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Pre-submission representation of a {@code QuizOption}.
 *
 * <p><b>Deliberately has no {@code correct} field.</b> This isn't "correct
 * left null" — the field does not exist on this class, so there is no code
 * path in the pre-submission flow that could accidentally serialize it.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizOptionPublicResponse {

    private String id;

    private String text;
}
