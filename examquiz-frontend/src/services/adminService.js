import { apiClient } from './apiClient';

export const adminService = {
  async getDashboard() {
    const response = await apiClient.get('/api/admin/dashboard');
    return response.data.data; // AdminDashboardResponse
  },

  async getStudents({ search, page = 0, size = 20 } = {}) {
    const response = await apiClient.get('/api/admin/students', {
      params: { search: search || undefined, page, size },
    });
    return response.data.data; // PageResponse<StudentSummaryResponse>
  },
  async deleteStudent(id) {
  await apiClient.delete(`/api/admin/students/${id}`);
},

  async getAnalytics() {
    const response = await apiClient.get('/api/admin/analytics');
    return response.data.data; // AdminAnalyticsResponse
  },
};
