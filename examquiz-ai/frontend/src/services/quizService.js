import { apiClient } from './apiClient';

export const quizService = {
  async generateQuiz(payload) {
    const response = await apiClient.post('/api/quizzes/generate', payload);
    return response.data.data; // QuizResponse (no answer key)
  },

  async getQuiz(id) {
    const response = await apiClient.get(`/api/quizzes/${id}`);
    return response.data.data; // QuizResponse (no answer key)
  },

  async submitQuiz(id, { answers }) {
    const response = await apiClient.post(`/api/quizzes/${id}/submit`, { answers });
    return response.data.data; // QuizAttemptResponse (answers revealed)
  },

  async getHistory({ page = 0, size = 10 } = {}) {
    const response = await apiClient.get('/api/quizzes/history', { params: { page, size } });
    return response.data.data; // PageResponse<QuizAttemptSummaryResponse>
  },
};
