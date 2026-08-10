package com.examquizai.backend.dto.request;

import com.examquizai.backend.model.enums.DifficultyLevel;
import com.examquizai.backend.model.enums.EntranceExam;
import com.examquizai.backend.model.enums.QuestionType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parameters used to request a new AI-generated quiz.
 *
 * Flow:
 *
 * Exam
 *   ↓
 * Subject
 *   ↓
 * Topic
 *   ↓
 * Difficulty
 *   ↓
 * Question Type
 *   ↓
 * Number of Questions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizGenerationRequest {

    /**
     * Entrance examination.
     *
     * Examples:
     * JEE_MAIN
     * JEE_ADVANCED
     * NEET
     * CAT
     * GATE
     */
    @NotNull(message = "exam is required")
    private EntranceExam exam;

    /**
     * Subject/category.
     *
     * Examples:
     * Physics
     * Chemistry
     * Mathematics
     * Biology
     */
    @NotBlank(message = "subject is required")
    private String subject;

    /**
     * Topic.
     *
     * Examples:
     * Kinematics
     * Thermodynamics
     * Genetics
     */
    @NotBlank(message = "topic is required")
    private String topic;

    /**
     * Difficulty level.
     */
    @NotNull(message = "difficulty is required")
    private DifficultyLevel difficulty;

    /**
     * Number of questions.
     */
    @Positive(message = "numberOfQuestions must be positive")
    @Max(
        value = 100,
        message = "numberOfQuestions must not exceed 100"
    )
    private int numberOfQuestions;

    /**
     * Question type.
     */
    @NotNull(message = "questionType is required")
    private QuestionType questionType;

    /**
     * Optional instructions for the AI agent.
     */
    private String additionalInstructions;

    /**
     * Language used for the generated questions.
     */
    @Builder.Default
    private String language = "en";
}