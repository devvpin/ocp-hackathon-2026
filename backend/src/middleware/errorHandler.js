/**
 * errorHandler.js — Global error handling middleware.
 *
 * Maps known application error classes / codes to HTTP status codes.
 * In production, never leaks stack traces.
 * Always responds with the standard { success: false, error: {...} } envelope.
 */

const env = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Known application error codes and their HTTP status mappings.
 */
const ERROR_STATUS_MAP = {
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  ACCOUNT_ARCHIVED: 403,
  TOKEN_EXPIRED: 401,
  INVALID_TOKEN: 401,
  SESSION_ALREADY_OPEN: 409,
  SESSION_NOT_OPEN: 400,
  DRAFT_ONLY: 400,
  TABLE_OCCUPIED: 409,
  INVALID_KDS_TRANSITION: 400,
};

/**
 * AppError — throw this anywhere in the app to produce a structured error response.
 *
 * @example
 *   throw new AppError('NOT_FOUND', 'Product not found.');
 *   throw new AppError('VALIDATION_ERROR', 'Invalid input.', [{ field: 'email', message: 'Required' }]);
 */
class AppError extends Error {
  constructor(code, message, details = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.statusCode = ERROR_STATUS_MAP[code] || 500;
  }
}

/**
 * Express global error handler — must be registered last (4-arg middleware).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // AppError: controlled, known errors
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Prisma known error codes
  if (err.code === 'P2002') {
    // Unique constraint violation
    return sendError(res, 409, 'CONFLICT', 'A record with these values already exists.');
  }
  if (err.code === 'P2025') {
    // Record not found (Prisma)
    return sendError(res, 404, 'NOT_FOUND', 'The requested record was not found.');
  }
  if (err.code === 'P2003') {
    // Foreign key constraint violation
    return sendError(res, 400, 'BAD_REQUEST', 'A referenced record does not exist.');
  }

  // JWT errors (should be caught by requireAuth, but safety net)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid or expired.');
  }

  // Unexpected errors — log full details server-side, hide from client in production
  console.error('[ErrorHandler]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const responseMessage =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message;

  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', responseMessage);
}

module.exports = { errorHandler, AppError };
