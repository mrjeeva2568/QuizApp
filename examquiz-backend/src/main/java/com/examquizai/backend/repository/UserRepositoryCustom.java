package com.examquizai.backend.repository;

import com.examquizai.backend.model.document.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Custom (non-derivable) query fragment for {@link UserRepository}, implemented
 * with {@code MongoTemplate} to support an optional text search plus an optional
 * status filter in a single dynamic query — a shape Spring Data's method-name
 * derivation can't express cleanly since either filter may be absent.
 */
public interface UserRepositoryCustom {

    /**
     * Searches STUDENT accounts by optional free-text (matches full name or
     * email, case-insensitive) and optional enabled/disabled status.
     *
     * @param search free-text filter, or blank/null to skip it
     * @param enabled status filter, or null to include both enabled and disabled
     */
    Page<User> searchStudents(String search, Boolean enabled, Pageable pageable);
}
