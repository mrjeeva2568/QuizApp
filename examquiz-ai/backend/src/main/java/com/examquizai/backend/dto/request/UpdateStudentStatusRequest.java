package com.examquizai.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for enabling or disabling a STUDENT account.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentStatusRequest {

    @NotNull(message = "enabled is required")
    private Boolean enabled;
}
