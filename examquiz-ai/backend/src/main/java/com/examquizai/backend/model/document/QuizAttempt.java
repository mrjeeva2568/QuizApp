package com.examquizai.backend.model.document;

import com.examquizai.backend.model.enums.AttemptStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB document representing a single student's attempt at a quiz.
 *
 * <p><b>Relationships:</b></p>
 * <ul>
 *   <li><b>User &rarr; QuizAttempt (one-to-many, referenced):</b> {@code userId} stores
 *   only the referenced {@link User}'s id (indexed), not an embedded/DBRef object.
 *   This is the recommended MongoDB pattern for one-to-many relationships where the
 *   "many" side is unbounded and queried independently of the parent (e.g. "get all
 *   attempts for user X", paginated, sorted, filtered by status) — embedding attempts
 *   inside {@code User} would force loading a user's entire attempt history just to
 *   authenticate them, and risks unbounded document growth.</li>
 *   <li><b>QuizAttempt &rarr; Quiz (many-to-one, referenced):</b> {@code quizId} is a
 *   plain reference to the (not-yet-implemented) Quiz collection. {@code quizTitle} is
 *   intentionally denormalized alongside it (the "extended reference" pattern) so
 *   attempt history/listing screens can render without an extra lookup — acceptable
 *   here because a quiz's title changes rarely relative to how often attempt history
 *   is read.</li>
 *   <li><b>QuizAttempt &rarr; QuestionAnswer (one-to-many, embedded):</b> see
 *   {@link QuestionAnswer} javadoc for why answers are embedded rather than referenced.</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quizAttempts")
@CompoundIndexes({
        // Primary access pattern: "all of this user's attempts at this quiz, newest first"
        @CompoundIndex(name = "user_quiz_created_idx", def = "{'userId': 1, 'quizId': 1, 'createdAt': -1}"),
        // Secondary access pattern: "this user's attempt history, newest first"
        @CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': -1}")
})
public class QuizAttempt {

    @Id
    private String id;

    /**
     * Reference to {@link User#getId()}. Indexed for fast per-user lookups.
     */
    @Indexed
    @Field("userId")
    private String userId;

    /**
     * Reference to the quiz (Quiz collection - future module). Indexed for
     * "all attempts at this quiz" queries (e.g. admin analytics).
     */
    @Indexed
    @Field("quizId")
    private String quizId;

    /**
     * Denormalized quiz title at time of attempt start, avoiding a join for list views.
     */
    private String quizTitle;

    @Builder.Default
    private List<QuestionAnswer> answers = new ArrayList<>();

    private int totalQuestions;

    private int correctAnswers;

    /**
     * Raw score achieved (e.g. sum of pointsAwarded across answers).
     */
    private Double score;

    /**
     * Maximum possible score for this attempt's quiz.
     */
    private Double maxScore;

    @Indexed
    @Builder.Default
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    private Instant startedAt;

    private Instant submittedAt;

    /**
     * Total time spent on the attempt, in seconds. Set on submission.
     */
    private Long durationSeconds;

    /**
     * Optimistic locking version — quiz attempts are mutated incrementally
     * (answer by answer) as the student progresses, so concurrent-write
     * protection matters more here than on most other documents.
     */
    @Version
    private Long version;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
