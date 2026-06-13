/**
 * env.js — loads and validates environment variables at startup.
 * All other modules should import env values from here, never from process.env directly.
 */

require('dotenv').config();

const env = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '8h',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@cafedemo.com',

  CAFE_NAME: process.env.CAFE_NAME || 'Odoo Cafe',
};

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_secret_change_me') {
  throw new Error('Cannot use the default JWT_SECRET in production.');
}

module.exports = env;
