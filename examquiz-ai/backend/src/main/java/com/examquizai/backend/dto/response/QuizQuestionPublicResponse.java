package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Pre-submission representation of a {@code QuizQuestion}.
 *
 * <p><b>Deliberately has no {@code correctAnswer} or {@code explanation}
 * field</b> — those only exist on the post-submission DTOs
 * ({@code QuestionAnswerResponse}). This class cannot leak an answer key
 * even by future accident, because there is nothing on it to leak.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestionPublicResponse {

    private String id;

    private String questionText;

    private QuestionType questionType;

    private List<QuizOptionPublicResponse> options;

    private double points;
}
