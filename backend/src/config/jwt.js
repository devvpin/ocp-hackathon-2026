/**
 * jwt.js — JWT sign and verify helpers.
 */

const jwt = require('jsonwebtoken');
const env = require('./env');

/**
 * Signs a JWT with the standard payload.
 * @param {{ sub: string, role: string, email: string, name: string }} payload
 * @returns {string} signed token
 */
function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
}

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
