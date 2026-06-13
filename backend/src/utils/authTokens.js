'use strict';

const jwt = require('jsonwebtoken');

const blacklistedTokens = new Map();

function blacklistToken(token) {
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 8 * 60 * 60 * 1000;

  blacklistedTokens.set(token, expiresAt);
}

function isTokenBlacklisted(token) {
  const expiresAt = blacklistedTokens.get(token);
  if (!expiresAt) return false;

  if (expiresAt <= Date.now()) {
    blacklistedTokens.delete(token);
    return false;
  }

  return true;
}

module.exports = { blacklistToken, isTokenBlacklisted };
