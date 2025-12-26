/**
 * Authentication Controller
 * -------------------------
 * Handles user registration, login, profile management.
 * All auth-related business logic resides here.
 */

import User from '../models/User.js';
import logger from '../utils/logger.js';
import { 
  successResponse, 
  createdResponse, 
  errorResponse, 
  HttpStatus 
} from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Sanitize user object for response (remove sensitive fields)
 * @param {object} user - Mongoose user document
 * @returns {object} - Sanitized user object
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  return {
    id: userObj._id,
    username: userObj.username,
    email: userObj.email,
    role: userObj.role,
    organization: userObj.organization,
    isActive: userObj.isActive,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
  };
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password, role, organization } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return errorResponse(
        res, 
        'Please provide username, email, and password', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return errorResponse(
        res, 
        'Password must be at least 8 characters long', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Check if user already exists with email
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return errorResponse(
        res, 
        'An account with this email already exists', 
        HttpStatus.CONFLICT
      );
    }

    // Check if user already exists with username
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return errorResponse(
        res, 
        'This username is already taken', 
        HttpStatus.CONFLICT
      );
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'viewer',
      organization: organization || null,
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Update last login
    await user.updateLastLogin();

    logger.info(`New user registered: ${user.email}`);

    // Return success response
    return createdResponse(res, {
      token,
      user: sanitizeUser(user),
    }, 'Registration successful');

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    // Validate input - need either email or username
    if ((!email && !username) || !password) {
      return errorResponse(
        res, 
        'Please provide email/username and password', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Find user by email or username (include password for comparison)
    let user;
    if (email) {
      user = await User.findByEmail(email);
    } else {
      user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    }

    // Check if user exists
    if (!user) {
      return errorResponse(
        res, 
        'Invalid credentials', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(
        res, 
        'Your account has been deactivated. Please contact support.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return errorResponse(
        res, 
        'Invalid credentials', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    // Update last login timestamp
    await user.updateLastLogin();

    logger.info(`User logged in: ${user.email}`);

    // Return success response
    return successResponse(res, {
      token,
      user: sanitizeUser(user),
    }, 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private (requires authentication)
 */
export const getProfile = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user.userId);

    if (!user) {
      return errorResponse(
        res, 
        'User not found', 
        HttpStatus.NOT_FOUND
      );
    }

    return successResponse(res, {
      user: sanitizeUser(user),
    }, 'Profile retrieved successfully');

  } catch (error) {
    logger.error('Get profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private (requires authentication)
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { username, email, organization } = req.body;
    const userId = req.user.userId;

    // Fields that can be updated
    const updateFields = {};

    if (username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return errorResponse(
          res, 
          'This username is already taken', 
          HttpStatus.CONFLICT
        );
      }
      updateFields.username = username;
    }

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return errorResponse(
          res, 
          'An account with this email already exists', 
          HttpStatus.CONFLICT
        );
      }
      updateFields.email = email;
    }

    if (organization !== undefined) {
      updateFields.organization = organization;
    }

    // Check if there's anything to update
    if (Object.keys(updateFields).length === 0) {
      return errorResponse(
        res, 
        'No valid fields to update', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return errorResponse(
        res, 
        'User not found', 
        HttpStatus.NOT_FOUND
      );
    }

    logger.info(`User profile updated: ${updatedUser.email}`);

    return successResponse(res, {
      user: sanitizeUser(updatedUser),
    }, 'Profile updated successfully');

  } catch (error) {
    logger.error('Update profile error:', error);
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private (requires authentication)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!currentPassword || !newPassword) {
      return errorResponse(
        res, 
        'Please provide current password and new password', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return errorResponse(
        res, 
        'New password must be at least 8 characters long', 
        HttpStatus.BAD_REQUEST
      );
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return errorResponse(
        res, 
        'User not found', 
        HttpStatus.NOT_FOUND
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return errorResponse(
        res, 
        'Current password is incorrect', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Generate new token (old tokens will be invalid after password change)
    const token = user.generateAuthToken();

    logger.info(`Password changed for user: ${user.email}`);

    return successResponse(res, {
      token,
      message: 'Password changed successfully',
    }, 'Password changed successfully');

  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
};

/**
 * @desc    Logout user (client-side token removal, optionally invalidate refresh token)
 * @route   POST /api/auth/logout
 * @access  Private (requires authentication)
 */
export const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Clear refresh token in database (if using refresh tokens)
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    logger.info(`User logged out: ${req.user.email}`);

    return successResponse(res, null, 'Logged out successfully');

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
