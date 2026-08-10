package com.examquizai.backend.model.enums;

/**
 * Application user roles used for role-based access control.
 *
 * <p>{@code STUDENT} is the only role assignable via public registration.
 * {@code ADMIN} accounts are provisioned separately (see {@code AdminAccountInitializer})
 * and can never be self-registered.</p>
 */
public enum Role {
    STUDENT,
    ADMIN
}
