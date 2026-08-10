package com.examquizai.backend.controller;

import com.examquizai.backend.dto.request.QuizGenerationRequest;
import com.examquizai.backend.dto.request.SubmitQuizAttemptRequest;
import com.examquizai.backend.dto.response.ApiResponse;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.QuizAttemptResponse;
import com.examquizai.backend.dto.response.QuizAttemptSummaryResponse;
import com.examquizai.backend.dto.response.QuizResponse;
import com.examquizai.backend.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Quiz generation, retrieval, submission, and attempt history.
 *
 * <p>All endpoints require authentication (enforced by {@code SecurityConfig}'s
 * default "authenticate everything not explicitly public" rule — nothing under
 * {@code /api/quizzes/**} is in the public endpoint list).</p>
 *
 * <p><b>Answer-key discipline:</b> {@code generate} and {@code getById} return
 * {@link QuizResponse}, which cannot carry correct answers. Only {@code submit}
 * returns a response with correct answers revealed, and only for the attempt
 * just graded.</p>
 */
@RestController
@RequestMapping("/api/quizzes")
@Validated
@RequiredArgsConstructor
@Tag(name = "Quizzes", description = "AI-generated quiz retrieval, submission, and history")
public class QuizController {

    private final QuizService quizService;

    @Operation(summary = "Generate a new AI quiz via the UiPath agent and persist it. Never returns correct answers.")
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuiz(
            @Valid @RequestBody QuizGenerationRequest request,
            Authentication authentication) {
        QuizResponse response = quizService.generateQuiz(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quiz generated successfully", response));
    }

    @Operation(summary = "Submit answers for a quiz and receive the graded result, including correct answers.")
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> submitQuiz(
            @PathVariable String id,
            @Valid @RequestBody SubmitQuizAttemptRequest request,
            Authentication authentication) {
        QuizAttemptResponse response = quizService.submitQuiz(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Quiz submitted successfully", response));
    }

    @Operation(summary = "Get the authenticated user's quiz attempt history, newest first.")
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<QuizAttemptSummaryResponse>>> getHistory(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size,
            Authentication authentication) {
        PageResponse<QuizAttemptSummaryResponse> response = quizService.getHistory(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Get a quiz by id for taking it. Never returns correct answers.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable String id) {
        QuizResponse response = quizService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
