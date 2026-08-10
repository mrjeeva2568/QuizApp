import { apiClient } from './apiClient';

export const authService = {
  async register({ fullName, email, password }) {
    const response = await apiClient.post('/api/v1/auth/register', { fullName, email, password });
    return response.data.data; // AuthResponse
  },

  async login({ email, password }) {
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    return response.data.data; // AuthResponse
  },

  async refresh(refreshToken) {
    const response = await apiClient.post('/api/v1/auth/refresh', { refreshToken });
    return response.data.data; // AuthResponse
  },
};
