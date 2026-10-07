import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending & receiving httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for uniform error parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network or connection error
      return Promise.reject(new Error('Unable to connect to the server. Please try again.'));
    }
    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
