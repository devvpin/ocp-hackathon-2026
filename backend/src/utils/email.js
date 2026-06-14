/**
 * email.js — Nodemailer-based email sender.
 *
 * Sets up the transporter and exposes a `sendMail` helper.
 */

const nodemailer = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');
const env = require('../config/env');

let transporter;

function buildMailtrapOptions() {
  const options = {
    token: env.MAILTRAP_TOKEN,
  };

  if (env.MAILTRAP_USE_SANDBOX) {
    options.sandbox = true;
    options.testInboxId = Number(env.MAILTRAP_INBOX_ID);
  }

  return options;
}

function sanitizeErrorMessage(error) {
  const message = error?.message || String(error);
  return message
    .replace(env.MAILTRAP_TOKEN, '[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]');
}

/**
 * Lazily creates and caches the email transporter.
 * Prefers Mailtrap API transport and falls back to SMTP credentials when needed.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (env.MAILTRAP_TOKEN) {
    transporter = nodemailer.createTransport(
      MailtrapTransport(buildMailtrapOptions())
    );

    return transporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[Email] Mailtrap token or SMTP credentials are not configured — receipt emails will be skipped in dev mode.');
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
 * Sends an email. Safe to call even if the email transport is not configured (no-ops in dev).
 *
 * @param {{ to: string, subject: string, html: string }} options
 * @returns {Promise<void>}
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] Email transport is not configured. Receipt email to ${to} was not sent.`);
    return { ok: false, skipped: true, message: 'Email transport is not configured. Receipt email was not sent.' };
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
    const details = sanitizeErrorMessage(error);
    console.error('[Email] Failed to send receipt email:', details);
    return {
      ok: false,
      skipped: false,
      message: 'Receipt email could not be sent right now.',
      details: env.NODE_ENV === 'production' ? undefined : details,
    };
  }
}

module.exports = { sendMail };
