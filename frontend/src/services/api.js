/**
 * API Service
 * -----------
 * Axios instance and API utilities for backend communication.
 */

import axios from 'axios';

// Token storage key
const TOKEN_KEY = 'authToken';

/**
 * Get token from localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Set token in localStorage
 * @param {string} token
 */
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Check if user is authenticated (has token)
 * @returns {boolean}
 */
export const hasToken = () => {
  return !!getToken();
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error codes
    if (error.response) {
      const { status, data } = error.response;
      
      // Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear token and redirect to login
        removeToken();
        
        // Only redirect if not already on login/register page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            window.location.href = '/login';
          }
        }
      }
      
      // Create a more informative error
      const message = data?.message || 'An error occurred';
      error.message = message;
    } else if (error.request) {
      // Network error
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

export default api;
