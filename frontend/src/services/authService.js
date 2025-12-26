/**
 * Authentication Service
 * ----------------------
 * API calls for authentication endpoints.
 */

import api from './api';

/**
 * Register a new user
 * @param {object} userData - { username, email, password, role?, organization? }
 * @returns {Promise<{ token, user }>}
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{ token, user }>}
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Login with username
 * @param {string} username - Username
 * @param {string} password - User password
 * @returns {Promise<{ token, user }>}
 */
export const loginWithUsername = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise<{ user }>}
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

/**
 * Update user profile
 * @param {object} profileData - { username?, email?, organization? }
 * @returns {Promise<{ user }>}
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{ token, message }>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/auth/password', { currentPassword, newPassword });
  return response.data;
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Logout should succeed even if API call fails
    console.warn('Logout API call failed:', error);
  }
};

export default {
  register,
  login,
  loginWithUsername,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
