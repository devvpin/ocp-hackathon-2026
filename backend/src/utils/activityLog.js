'use strict';

const prisma = require('../config/db');

/**
 * Write an entry to the ActivityLog table.
 * Fire-and-forget — never throws, so a logging failure never breaks the main flow.
 *
 * @param {object} opts
 * @param {string|null} opts.userId
 * @param {string}      opts.action     - e.g. 'order.created', 'session.opened'
 * @param {string}      opts.entityType - e.g. 'order', 'session', 'payment'
 * @param {string|null} opts.entityId
 * @param {object|null} opts.metadata   - any extra JSON data
 */
async function logActivity({ userId = null, action, entityType, entityId = null, metadata = null }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    // Never propagate — logging must not break business logic
    console.error('[ActivityLog] Failed to write:', action, err?.message);
  }
}

module.exports = { logActivity };
