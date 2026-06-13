/**
 * response.js — Standardised JSON response helpers.
 *
 * All API responses follow this envelope:
 *
 * Success:
 *   { "success": true, "data": {...}, "meta": { "page": 1, "limit": 20, "total": 150 } }
 *
 * Error:
 *   { "success": false, "error": { "code": "...", "message": "...", "details": [] } }
 *
 * The `meta` field is only included for list responses (sendList).
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode  HTTP status (200, 201, etc.)
 * @param {*} data             Payload — object or array
 * @param {object} [meta]      Optional pagination meta { page, limit, total }
 */
function sendSuccess(res, statusCode, data, meta) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Send a paginated list response.
 * @param {import('express').Response} res
 * @param {Array}  data
 * @param {{ page: number, limit: number, total: number }} meta
 */
function sendList(res, data, meta) {
  return sendSuccess(res, 200, data, meta);
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} code         Machine-readable error code
 * @param {string} message      Human-readable message
 * @param {Array}  [details=[]] Field-level validation errors
 */
function sendError(res, statusCode, code, message, details = []) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, details },
  });
}

module.exports = { sendSuccess, sendList, sendError };
