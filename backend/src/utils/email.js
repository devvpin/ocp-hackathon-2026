'use strict';

const nodemailer = require('nodemailer');

const env = require('../config/env');

let transporter;

function isConfigured() {
  return Boolean(env.MAILTRAP_HOST && env.MAILTRAP_PORT && env.MAILTRAP_USER && env.MAILTRAP_PASS);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.MAILTRAP_HOST,
    port: env.MAILTRAP_PORT,
    secure: env.MAILTRAP_PORT === 465,
    auth: {
      user: env.MAILTRAP_USER,
      pass: env.MAILTRAP_PASS,
    },
  });

  return transporter;
}

function redact(value) {
  if (!value) return value;
  return String(value)
    .replace(env.MAILTRAP_USER, '[mailtrap-user]')
    .replace(env.MAILTRAP_PASS, '[mailtrap-pass]');
}

async function sendMail({ to, subject, html, text }) {
  const mailer = getTransporter();

  if (!mailer) {
    return {
      ok: false,
      skipped: true,
      message: 'Mailtrap SMTP credentials are not configured.',
    };
  }

  try {
    const info = await mailer.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    return {
      ok: true,
      skipped: false,
      message: 'Receipt email sent successfully.',
      messageId: info.messageId,
    };
  } catch (error) {
    const details = redact(error?.message || String(error));
    console.error('[Email] Receipt email failed:', details);

    return {
      ok: false,
      skipped: false,
      message: 'Receipt email could not be sent right now.',
      details: env.NODE_ENV === 'production' ? undefined : details,
    };
  }
}

module.exports = { sendMail };
