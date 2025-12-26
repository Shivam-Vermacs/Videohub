/**
 * Error Handler Middleware
 * ------------------------
 * Global error handling middleware for Express.
 * Handles operational errors, validation errors, and unexpected exceptions.
 */

import logger from '../utils/logger.js';
import { errorResponse, HttpStatus } from '../utils/apiResponse.js';

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(message, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, HttpStatus.BAD_REQUEST);
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for ${field}: "${value}". Please use a different value.`;
  return new AppError(message, HttpStatus.CONFLICT);
};

/**
 * Handle Mongoose validation error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, HttpStatus.BAD_REQUEST);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', HttpStatus.UNAUTHORIZED);
};

/**
 * Handle JWT expiration
 */
const handleJWTExpiredError = () => {
  return new AppError('Your session has expired. Please log in again.', HttpStatus.UNAUTHORIZED);
};

/**
 * Send error response in development mode
 */
const sendDevError = (err, res) => {
  const response = {
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  };
  
  return res.status(err.statusCode).json(response);
};

/**
 * Send error response in production mode
 */
const sendProdError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode);
  }
  
  // Programming or other unknown error: don't leak error details
  logger.error('Unexpected error:', err);
  return errorResponse(res, 'Something went wrong. Please try again later.', HttpStatus.INTERNAL_SERVER_ERROR);
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  // Log error
  logger.error(`${err.statusCode} - ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendProdError(error, res);
  } else {
    sendDevError(err, res);
  }
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.method} ${req.originalUrl} on this server`,
    HttpStatus.NOT_FOUND
  );
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { errorHandler, notFoundHandler, asyncHandler, AppError as default };
