package com.examquizai.backend.model.document;

import com.examquizai.backend.model.enums.Role;
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
import java.util.HashSet;
import java.util.Set;

/**
 * MongoDB document representing an application user (STUDENT or ADMIN).
 *
 * <p>Relationship note: {@link QuizAttempt} documents reference this user via
 * {@code userId} (a plain indexed String, not an embedded/DBRef). Attempts are
 * <b>not</b> embedded here because the collection of attempts per user is
 * unbounded and grows over time — embedding would risk unbounded document
 * growth and repeated document reallocation. See {@link QuizAttempt} for the
 * reference side of this one-to-many relationship.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    /**
     * BCrypt-hashed password. Never returned in API responses.
     */
    private String password;

    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private boolean accountNonLocked = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
