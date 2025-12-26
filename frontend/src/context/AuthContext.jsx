/**
 * Authentication Context
 * ----------------------
 * React context for authentication state management.
 * Provides login, register, logout functions and user state.
 * Integrates with Socket.io for real-time updates.
 */

import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken, removeToken, getToken } from '../services/api';
import * as authService from '../services/authService';
import socketService from '../services/socketService';

// Create the context
export const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Wraps the app and provides auth state and functions
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useMemo(() => {
    return !!token && !!user;
  }, [token, user]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Verify token and get user profile on mount
   */
  const checkAuth = useCallback(async () => {
    const storedToken = getToken();
    
    if (!storedToken) {
      setIsLoading(false);
      setUser(null);
      setTokenState(null);
      return;
    }

    try {
      const response = await authService.getProfile();
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setTokenState(storedToken);
      } else {
        // Invalid response - clear auth
        removeToken();
        setUser(null);
        setTokenState(null);
      }
    } catch (err) {
      // Token is invalid or expired
      console.warn('Auth check failed:', err.message);
      removeToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new user
   * @param {object} userData - { username, email, password, role?, organization? }
   * @returns {Promise<boolean>} - Success status
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        
        // Store token
        setToken(newToken);
        setTokenState(newToken);
        setUser(newUser);
        
        // Navigate to dashboard
        navigate('/');
        
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} - Success status
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        
        // Store token
        setToken(newToken);
        setTokenState(newToken);
        setUser(newUser);
        
        // Navigate to dashboard
        navigate('/');
        
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      // Disconnect socket on logout
      socketService.disconnect();
      
      // Always clear local state
      removeToken();
      setTokenState(null);
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Update user profile
   * @param {object} profileData - Updated profile data
   * @returns {Promise<boolean>} - Success status
   */
  const updateProfile = useCallback(async (profileData) => {
    setError(null);

    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        return true;
      } else {
        setError(response.message || 'Profile update failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setError(null);

    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success && response.data?.token) {
        // Update token after password change
        setToken(response.data.token);
        setTokenState(response.data.token);
        return true;
      } else {
        setError(response.message || 'Password change failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password change failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Connect socket when authenticated
  useEffect(() => {
    if (token && user) {
      console.log('Connecting socket for authenticated user...');
      socketService.connect(token);
    }
    
    return () => {
      // Cleanup on unmount
      if (!token || !user) {
        socketService.disconnect();
      }
    };
  }, [token, user]);

  // Context value
  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuth,
    clearError,
  }), [
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuth,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
