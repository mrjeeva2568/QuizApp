import { apiClient } from './apiClient';

export const adminService = {
  async getDashboard() {
    const response = await apiClient.get('/api/admin/dashboard');
    return response.data.data; // AdminDashboardResponse
  },

  async getStudents({ search, enabled, page = 0, size = 20 } = {}) {
    const response = await apiClient.get('/api/admin/students', {
      params: { search: search || undefined, enabled, page, size },
    });
    return response.data.data; // PageResponse<StudentSummaryResponse>
  },

  async getAnalytics() {
    const response = await apiClient.get('/api/admin/analytics');
    return response.data.data; // AdminAnalyticsResponse
  },

  async updateStudentStatus(id, enabled) {
    const response = await apiClient.patch(`/api/admin/students/${id}/status`, { enabled });
    return response.data.data; // StudentSummaryResponse
  },
};
