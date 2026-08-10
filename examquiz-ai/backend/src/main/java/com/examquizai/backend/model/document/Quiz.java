package com.examquizai.backend.model.document;

import com.examquizai.backend.model.enums.DifficultyLevel;
import com.examquizai.backend.model.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB document representing a generated quiz (persisted result of an
 * {@code AiAgentService#generateQuiz} call).
 *
 * <p><b>Relationships:</b></p>
 * <ul>
 *   <li><b>User &rarr; Quiz (one-to-many, referenced):</b> {@code createdBy}
 *   stores only the generating {@link User}'s id (indexed), for the same
 *   reasons {@code QuizAttempt.userId} is a reference rather than an embed.</li>
 *   <li><b>Quiz &rarr; QuizQuestion (one-to-many, embedded):</b> see
 *   {@link QuizQuestion} javadoc.</li>
 *   <li><b>Quiz &rarr; QuizAttempt (one-to-many, referenced from the attempt
 *   side):</b> {@code QuizAttempt.quizId} references this document's id;
 *   {@code Quiz} does not hold a back-reference list of attempts (unbounded,
 *   same reasoning as {@code User}).</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quizzes")
public class Quiz {

    @Id
    private String id;

    private String title;

    private String description;

    private String subject;

    private DifficultyLevel difficulty;

    private QuestionType questionType;

    /**
     * Reference to {@link User#getId()} of whoever requested this quiz's generation.
     */
    @Indexed
    private String createdBy;

    @Builder.Default
    private List<QuizQuestion> questions = new ArrayList<>();

    private int totalQuestions;

    /**
     * Sum of all questions' points - the denominator for scoring an attempt.
     */
    private double maxScore;

    /**
     * The UiPath agent's execution/run id that produced this quiz, kept for traceability.
     */
    private String agentExecutionId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
