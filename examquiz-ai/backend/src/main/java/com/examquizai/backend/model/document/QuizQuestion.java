package com.examquizai.backend.model.document;

import com.examquizai.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * A single question belonging to a {@link Quiz}, embedded rather than stored in
 * its own collection — bounded per quiz, always read/written with the parent,
 * and never queried independently (same reasoning as {@code QuestionAnswer}
 * within {@code QuizAttempt}).
 *
 * <p><b>Sensitive fields:</b> {@code correctAnswer} and {@code explanation}
 * must never be serialized into a response returned before the student has
 * submitted an attempt for this question. {@code QuizQuestionPublicResponse}
 * (the pre-submission DTO) has no such fields at all.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {

    /**
     * Stable identifier, generated at quiz-creation time, used to correlate a
     * submitted answer back to this question.
     */
    private String id;

    private String questionText;

    private QuestionType questionType;

    /**
     * Populated for MULTIPLE_CHOICE / TRUE_FALSE. Empty for SHORT_ANSWER.
     */
    @Builder.Default
    private List<QuizOption> options = new ArrayList<>();

    /**
     * Populated for SHORT_ANSWER questions only. Never exposed pre-submission.
     */
    private String correctAnswer;

    /**
     * Optional rationale shown after evaluation. Never exposed pre-submission.
     */
    private String explanation;

    @Builder.Default
    private double points = 1.0;
}
