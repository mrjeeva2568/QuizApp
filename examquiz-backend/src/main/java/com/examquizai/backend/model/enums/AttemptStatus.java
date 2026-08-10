package com.examquizai.backend.model.enums;

/**
 * Lifecycle states of a {@code QuizAttempt}.
 */
public enum AttemptStatus {

    /** Attempt has been started; the student is actively answering. */
    IN_PROGRESS,

    /** Student submitted all answers; awaiting scoring. */
    SUBMITTED,

    /** Attempt has been scored and final results are available. */
    EVALUATED,

    /** Attempt was started but never submitted (e.g. time expired, session abandoned). */
    ABANDONED
}
