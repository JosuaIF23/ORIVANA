import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

// Create axios instance with base config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for auth, error handling, etc.
apiClient.interceptors.request.use((config) => {
  // Try to get token from store first, fallback to localStorage
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeClientId = useUserStore.getState().activeClientId;
  if (activeClientId) {
    config.headers['X-Client-Id'] = String(activeClientId);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isLoginRequest = requestUrl.includes('/auth/login');
      const isAlreadyOnLoginPage = window.location.pathname === '/login';

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('clients');
      localStorage.removeItem('active_client_id');

      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

