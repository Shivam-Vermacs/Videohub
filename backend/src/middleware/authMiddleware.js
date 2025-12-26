/**
 * Authentication Middleware
 * -------------------------
 * JWT verification, role-based access control, and optional auth.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { errorResponse, HttpStatus } from '../utils/apiResponse.js';

/**
 * Extract token from Authorization header
 * @param {object} req - Express request object
 * @returns {string|null} - Token or null if not found
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  // Also check for token in cookies (for future use)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};

/**
 * @desc    Protect routes - verify JWT token and attach user to request
 * @usage   router.get('/protected', protect, controllerFn)
 */
export const protect = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);
    
    if (!token) {
      return errorResponse(
        res, 
        'Authentication required. Please log in to access this resource.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return errorResponse(
          res, 
          'Your session has expired. Please log in again.', 
          HttpStatus.UNAUTHORIZED
        );
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return errorResponse(
          res, 
          'Invalid authentication token.', 
          HttpStatus.UNAUTHORIZED
        );
      }
      throw jwtError;
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(
        res, 
        'The user associated with this token no longer exists.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(
        res, 
        'Your account has been deactivated.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAfter(decoded.iat)) {
      return errorResponse(
        res, 
        'Password was recently changed. Please log in again.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organization: decoded.organization,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return errorResponse(
      res, 
      'Authentication failed.', 
      HttpStatus.UNAUTHORIZED
    );
  }
};

/**
 * @desc    Restrict access to specific roles
 * @param   {...string} roles - Allowed roles
 * @usage   router.delete('/admin-only', protect, restrictTo('admin'), controllerFn)
 * @returns {function} - Express middleware
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // protect middleware should have already set req.user
    if (!req.user) {
      return errorResponse(
        res, 
        'Authentication required.', 
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
      return errorResponse(
        res, 
        'You do not have permission to perform this action.', 
        HttpStatus.FORBIDDEN
      );
    }

    next();
  };
};

/**
 * @desc    Optional authentication - attach user if token exists, but don't fail if not
 * @usage   router.get('/public-with-user', optionalAuth, controllerFn)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    // No token - continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive && !user.passwordChangedAfter(decoded.iat)) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          organization: decoded.organization,
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      // Token is invalid, but we don't fail - just continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    // Any error - continue without user
    req.user = null;
    next();
  }
};

/**
 * @desc    Verify user owns the resource or is admin
 * @param   {function} getResourceOwnerId - Function that returns owner ID from request
 * @usage   router.put('/resource/:id', protect, verifyOwnership(req => req.params.userId), controllerFn)
 * @returns {function} - Express middleware
 */
export const verifyOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      // Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (resourceOwnerId && resourceOwnerId.toString() === req.user.userId.toString()) {
        return next();
      }

      return errorResponse(
        res, 
        'You do not have permission to access this resource.', 
        HttpStatus.FORBIDDEN
      );
    } catch (error) {
      logger.error('Ownership verification error:', error);
      return errorResponse(
        res, 
        'Unable to verify resource ownership.', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };
};

/**
 * @desc    Verify user belongs to the same organization
 * @usage   router.get('/org-resource', protect, verifyOrganization, controllerFn)
 */
export const verifyOrganization = (req, res, next) => {
  // Admin can access anything
  if (req.user.role === 'admin') {
    return next();
  }

  // Get organization from request (could be in params, query, or body)
  const requestedOrg = req.params.organization || req.query.organization || req.body.organization;
  
  // If no organization specified, continue
  if (!requestedOrg) {
    return next();
  }

  // Check if user belongs to the requested organization
  if (req.user.organization !== requestedOrg) {
    return errorResponse(
      res, 
      'You do not have permission to access this organization\'s resources.', 
      HttpStatus.FORBIDDEN
    );
  }

  next();
};

export default {
  protect,
  restrictTo,
  optionalAuth,
  verifyOwnership,
  verifyOrganization,
};
