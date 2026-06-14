/**
 * email.js — Nodemailer-based email sender.
 *
 * Sets up the transporter and exposes a `sendMail` helper.
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

/**
 * Lazily creates and caches the SMTP transporter.
 * If SMTP credentials are not configured, logs a warning in dev.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[Email] SMTP credentials are not configured — receipt emails will be skipped in dev mode.');
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Sends an email. Safe to call even if SMTP is not configured (no-ops in dev).
 *
 * @param {{ to: string, subject: string, html: string }} options
 * @returns {Promise<void>}
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] SMTP is not configured. Receipt email to ${to} was not sent.`);
    return { ok: false, skipped: true, message: 'SMTP is not configured. Receipt email was not sent.' };
  }

  try {
    await t.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { ok: true, skipped: false, message: 'Receipt email sent successfully.' };
  } catch (error) {
    console.error('[Email] Failed to send receipt email:', error.message || error);
    return { ok: false, skipped: false, message: 'Receipt email could not be sent right now.' };
  }
}

module.exports = { sendMail };
