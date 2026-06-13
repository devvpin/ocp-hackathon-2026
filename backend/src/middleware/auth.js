/**
 * auth.js — requireAuth and requireRole middleware.
 *
 * requireAuth:
 *   - Reads `Authorization: Bearer <token>` header.
 *   - Verifies JWT; attaches decoded payload to req.user.
 *   - Returns 401 on missing / expired / invalid token.
 *
 * requireRole(...roles):
 *   - Must be used AFTER requireAuth in the middleware chain.
 *   - Returns 403 if req.user.role is not in the allowed list.
 */

const { verifyToken } = require('../config/jwt');
const { sendError } = require('../utils/response');
const { isTokenBlacklisted } = require('../utils/authTokens');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token is required.');
  }

  const token = authHeader.split(' ')[1];

  try {
    if (isTokenBlacklisted(token)) {
      return sendError(res, 401, 'INVALID_TOKEN', 'Authentication token has been logged out.');
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired.');
    }
    return sendError(res, 401, 'INVALID_TOKEN', 'Authentication token is invalid.');
  }
}

/**
 * Returns middleware that allows only the specified roles.
 * @param {...string} roles  e.g. requireRole('admin') or requireRole('admin','employee')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Required role(s): ${roles.join(', ')}.`
      );
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
