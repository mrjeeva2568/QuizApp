package com.examquizai.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * A single entry in the admin dashboard's recent-activity feed.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentAttemptResponse {

    private String attemptId;

    private String studentId;

    private String studentName;

    private String studentEmail;

    private String quizId;

    private String quizTitle;

    private Double score;

    private Double maxScore;

    private Instant submittedAt;
}
