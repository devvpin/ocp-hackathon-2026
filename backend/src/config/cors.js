/**
 * cors.js — CORS configuration for Express.
 * Allows the FRONTEND_URL origin and the required headers.
 */

const cors = require('cors');
const env = require('./env');

const corsOptions = {
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
};

module.exports = cors(corsOptions);
