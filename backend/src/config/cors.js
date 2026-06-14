/**
 * cors.js — CORS configuration for Express.
 * Allows the FRONTEND_URL origin and the required headers.
 */

const cors = require('cors');
const env = require('./env');

const allowedOrigins = new Set([
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://10.0.1.149:5173',
  'http://172.17.0.1:5173',
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
};

module.exports = cors(corsOptions);
