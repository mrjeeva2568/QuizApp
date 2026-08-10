package com.examquizai.backend.repository;

import com.examquizai.backend.model.document.User;
import com.examquizai.backend.model.enums.Role;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Data access for {@link User} documents. Extends {@link UserRepositoryCustom}
 * for the one query (dynamic student search) that method-name derivation can't
 * express cleanly.
 */
public interface UserRepository extends MongoRepository<User, String>, UserRepositoryCustom {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Total accounts holding the given role. Relies on MongoDB's array-containment
     * match semantics against the {@code roles} field (see
     * {@code com.examquizai.backend.repository.impl.UserRepositoryCustomImpl}).
     */
    long countByRolesContaining(Role role);

    long countByRolesContainingAndEnabled(Role role, boolean enabled);
}
