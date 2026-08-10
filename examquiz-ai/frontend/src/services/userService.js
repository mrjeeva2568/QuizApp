import { apiClient } from './apiClient';

export const userService = {
  async getCurrentUser() {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data.data; // UserResponse
  },

  async updateCurrentUser({ fullName }) {
    const response = await apiClient.put('/api/v1/users/me', { fullName });
    return response.data.data; // UserResponse
  },
};
