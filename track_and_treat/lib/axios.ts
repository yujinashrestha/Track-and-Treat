import axios from 'axios';

// Create a centralized axios instance
// You can update the baseURL when your teammate provides the backend URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add Bearer token to requests
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logic for global logout can be triggered here
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
