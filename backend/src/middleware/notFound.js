/**
 * notFound.js — catch-all 404 handler for unmatched routes.
 * Must be registered AFTER all routes and BEFORE the errorHandler.
 */

const { sendError } = require('../utils/response');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function notFound(req, res) {
  sendError(
    res,
    404,
    'NOT_FOUND',
    `The requested resource '${req.method} ${req.originalUrl}' was not found.`
  );
}

module.exports = notFound;
