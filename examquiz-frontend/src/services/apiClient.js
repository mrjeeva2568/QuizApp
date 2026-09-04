import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { tokenStorage } from '../utils/tokenStorage';

/**
 * Shared axios instance for every backend call. Two concerns live here and
 * nowhere else:
 *   1. Attaching the current access token to every outgoing request.
 *   2. Transparently refreshing an expired access token exactly once, then
 *      retrying the original request - or logging the user out if the
 *      refresh itself fails.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Listeners notified when a session ends involuntarily (refresh failed).
 * AuthContext subscribes to this so it can clear state and redirect, without
 * apiClient needing to know anything about React Router or context.
 */
const sessionExpiredListeners = new Set();
export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}
function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener());
}

let refreshPromise = null;

function refreshAccessToken() {
  // Coalesce concurrent 401s into a single refresh call rather than firing
  // one refresh request per failed request.
  if (!refreshPromise) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'));
    }

    refreshPromise = axios
      .post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken })
      .then((response) => {
        const data = response.data?.data;
        if (!data?.accessToken) {
          throw new Error('Refresh response did not contain an accessToken');
        }
        tokenStorage.setSession(data);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes('/api/v1/auth/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        notifySessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable message from either response shape the backend
 * returns: ApiResponse ({success,message,data}) on handled errors, or
 * ErrorResponse ({status,error,message,path}) from GlobalExceptionHandler.
 * Both have a top-level "message" field, so this covers both without
 * needing to know which one came back.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
