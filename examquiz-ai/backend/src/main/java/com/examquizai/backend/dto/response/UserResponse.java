package com.examquizai.backend.dto.response;

import com.examquizai.backend.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

/**
 * Safe, outward-facing representation of a {@code User} document (never includes the password).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;

    private String fullName;

    private String email;

    private Set<Role> roles;

    private boolean enabled;

    private Instant createdAt;
}
