/**
 * API Response Utilities
 * ----------------------
 * Standardized response format for consistent API responses.
 * All endpoints should use these helpers for responses.
 */

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Success response helper
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data = null, message = 'Success', statusCode = HttpStatus.OK) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Error response helper
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {object} errors - Validation errors or additional error info
 */
export const errorResponse = (res, message = 'An error occurred', statusCode = HttpStatus.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 * @param {object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @param {string} message - Optional success message
 */
export const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    },
  };

  return res.status(HttpStatus.OK).json(response);
};

/**
 * Created response helper (for POST requests that create resources)
 * @param {object} res - Express response object
 * @param {object} data - Created resource data
 * @param {string} message - Optional success message
 */
export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, HttpStatus.CREATED);
};

/**
 * No content response helper (for DELETE requests)
 * @param {object} res - Express response object
 */
export const noContentResponse = (res) => {
  return res.status(HttpStatus.NO_CONTENT).send();
};

/**
 * Validation error response helper
 * @param {object} res - Express response object
 * @param {object} errors - Validation errors object
 */
export const validationErrorResponse = (res, errors) => {
  return errorResponse(
    res,
    'Validation failed',
    HttpStatus.UNPROCESSABLE_ENTITY,
    errors
  );
};

/**
 * Unauthorized response helper
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorizedResponse = (res, message = 'Authentication required') => {
  return errorResponse(res, message, HttpStatus.UNAUTHORIZED);
};

/**
 * Forbidden response helper
 * @param {object} res - Express response object
 * @param {string} message - Error message
 */
export const forbiddenResponse = (res, message = 'Access denied') => {
  return errorResponse(res, message, HttpStatus.FORBIDDEN);
};

/**
 * Not found response helper
 * @param {object} res - Express response object
 * @param {string} resource - Name of the resource not found
 */
export const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, HttpStatus.NOT_FOUND);
};

export default {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  HttpStatus,
};
