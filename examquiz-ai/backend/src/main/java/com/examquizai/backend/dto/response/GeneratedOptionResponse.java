package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single answer option within a {@link GeneratedQuestionResponse}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedOptionResponse {

    private String id;

    private String text;

    private boolean correct;
}
