/**
 * Authentication Routes
 * ---------------------
 * Routes for user registration, login, and profile management.
 */

import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user's profile
 * @access  Private (requires authentication)
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile
 * @access  Private (requires authentication)
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change current user's password
 * @access  Private (requires authentication)
 */
router.put('/password', protect, changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private (requires authentication)
 */
router.post('/logout', protect, logout);

export default router;
