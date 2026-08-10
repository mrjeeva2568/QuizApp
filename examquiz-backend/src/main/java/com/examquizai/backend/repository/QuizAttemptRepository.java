package com.examquizai.backend.repository;

import com.examquizai.backend.model.document.QuizAttempt;
import com.examquizai.backend.model.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * Data access for {@link QuizAttempt} documents.
 *
 * <p>Query method names are chosen to align with the compound indexes declared
 * on {@link QuizAttempt} ({@code user_quiz_created_idx}, {@code user_created_idx})
 * so Spring Data's derived queries can actually use them.</p>
 */
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String>, QuizAttemptRepositoryCustom {

    /**
     * A user's full attempt history, newest first. Uses {@code user_created_idx}.
     */
    Page<QuizAttempt> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * A user's attempts at one specific quiz, newest first. Uses {@code user_quiz_created_idx}.
     */
    List<QuizAttempt> findByUserIdAndQuizIdOrderByCreatedAtDesc(String userId, String quizId);

    /**
     * The most recent attempt by this user at this quiz, if any.
     */
    Optional<QuizAttempt> findFirstByUserIdAndQuizIdOrderByCreatedAtDesc(String userId, String quizId);

    /**
     * Whether the user already has an unfinished attempt at this quiz — used to
     * block starting a second concurrent attempt.
     */
    boolean existsByUserIdAndQuizIdAndStatus(String userId, String quizId, AttemptStatus status);

    /**
     * All attempts at a given quiz, regardless of student — used for admin-side analytics.
     */
    Page<QuizAttempt> findByQuizIdOrderByCreatedAtDesc(String quizId, Pageable pageable);

    /**
     * All attempts currently in a given status (e.g. sweeping stale IN_PROGRESS attempts).
     */
    List<QuizAttempt> findByStatus(AttemptStatus status);

    /**
     * The 10 most recently submitted attempts in a given status — feeds the
     * admin dashboard's recent-activity list.
     */
    List<QuizAttempt> findTop10ByStatusOrderBySubmittedAtDesc(AttemptStatus status);

    long countByUserIdAndStatus(String userId, AttemptStatus status);

    long countByQuizId(String quizId);
}
