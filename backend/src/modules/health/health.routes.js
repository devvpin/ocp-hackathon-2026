/**
 * health.routes.js — GET /api/health
 *
 * Returns server status and current ISO timestamp.
 * No authentication required — used for uptime checks.
 */

const { Router } = require('express');
const { sendSuccess } = require('../../utils/response');

const router = Router();

router.get('/', (_req, res) => {
  sendSuccess(res, 200, {
    status: 'ok',
    time: new Date().toISOString(),
  });
});

module.exports = router;
