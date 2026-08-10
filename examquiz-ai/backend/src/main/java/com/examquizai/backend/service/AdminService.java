package com.examquizai.backend.service;

import com.examquizai.backend.dto.response.AdminAnalyticsResponse;
import com.examquizai.backend.dto.response.AdminDashboardResponse;
import com.examquizai.backend.dto.response.PageResponse;
import com.examquizai.backend.dto.response.StudentSummaryResponse;

/**
 * Admin-only operations: dashboard summary, student management, and platform analytics.
 */
public interface AdminService {

    AdminDashboardResponse getDashboard();

    /**
     * @param search free-text filter over student name/email, or null/blank for none
     * @param enabled status filter, or null to include both enabled and disabled students
     */
    PageResponse<StudentSummaryResponse> getStudents(String search, Boolean enabled, int page, int size);

    AdminAnalyticsResponse getAnalytics();

    /**
     * Enables or disables a STUDENT account. Rejects targets that are not STUDENT
     * accounts (e.g. attempting to disable an ADMIN through this endpoint).
     */
    StudentSummaryResponse updateStudentStatus(String studentId, boolean enabled);
}
