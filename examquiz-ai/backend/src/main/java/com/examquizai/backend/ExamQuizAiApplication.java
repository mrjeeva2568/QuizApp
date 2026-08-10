package com.examquizai.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Entry point for the ExamQuiz AI backend service.
 *
 * <p>Tech stack: Java 21, Spring Boot 3, Spring Security (JWT), Spring Data MongoDB.
 * This service exposes REST APIs consumed by the React frontend and, in turn,
 * calls an externally hosted UiPath Agentic AI service (not implemented here).</p>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ExamQuizAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamQuizAiApplication.class, args);
    }

}
