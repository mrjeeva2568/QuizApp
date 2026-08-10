package com.examquizai.backend.controller;

import com.examquizai.backend.dto.request.UpdateStudentStatusRequest;
import com.examquizai.backend.dto.response.AdminAnalyticsResponse;
import com.examquizai.backend.dto.response.AdminDashboardResponse;
import com.examquizai.backend.dto.response.ApiResponse;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.StudentSummaryResponse;
import com.examquizai.backend.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin dashboard, student management, and platform analytics.
 *
 * <p>Every endpoint here is restricted to {@code ADMIN} via the class-level
 * {@code @PreAuthorize} — {@code STUDENT} accounts get {@code 403} even though
 * they're authenticated, since {@code /api/admin/**} isn't in the public
 * endpoint list and therefore also requires authentication in the first place.</p>
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Validated
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin dashboard, student management, and analytics (ADMIN only)")
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "High-level dashboard snapshot: totals, average score, and recent activity")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    @Operation(summary = "List STUDENT accounts, with optional search and status filter")
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<PageResponse<StudentSummaryResponse>>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        PageResponse<StudentSummaryResponse> response = adminService.getStudents(search, enabled, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Platform-wide analytics: score distribution, subject breakdown, trend, top quizzes")
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminAnalyticsResponse>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAnalytics()));
    }

    @Operation(summary = "Enable or disable a STUDENT account")
    @PatchMapping("/students/{id}/status")
    public ResponseEntity<ApiResponse<StudentSummaryResponse>> updateStudentStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStudentStatusRequest request) {
        StudentSummaryResponse response = adminService.updateStudentStatus(id, request.getEnabled());
        String message = request.getEnabled() ? "Student account enabled" : "Student account disabled";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
