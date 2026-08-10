package com.examquizai.backend.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A single question's answer within a {@link QuizAttempt}.
 *
 * <p><b>Modeling note:</b> this is an <i>embedded</i> sub-document, not its own
 * collection. A quiz attempt's answers are bounded (limited by the number of
 * questions in the quiz), always read/written together with the parent attempt,
 * and never queried independently — the textbook case for embedding rather than
 * referencing in MongoDB. Contrast with {@code QuizAttempt.userId}, which
 * *is* a reference because a user's attempts are unbounded and independently
 * queried.</p>
 *
 * <p>References {@code questionId} loosely (plain String) rather than embedding
 * or joining the question itself, since question content is owned by the
 * (not-yet-implemented) Question collection and may be large/versioned.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionAnswer {

    /**
     * Reference to the question this answer belongs to (Question collection - future module).
     */
    private String questionId;

    /**
     * Selected option identifiers, for single- or multi-select questions.
     */
    @Builder.Default
    private List<String> selectedOptionIds = new ArrayList<>();

    /**
     * Free-text answer, for short-answer/essay-style questions. Null for option-based questions.
     */
    private String textAnswer;

    /**
     * Whether this answer was correct. Null until the attempt has been evaluated.
     */
    private Boolean correct;

    /**
     * Points awarded for this answer. Null until evaluated.
     */
    private Double pointsAwarded;

    /**
     * When the student submitted/changed this specific answer.
     */
    private Instant answeredAt;
}
