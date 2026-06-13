'use strict';

const blacklistedTokens = new Set();

function blacklistToken(token) {
  blacklistedTokens.add(token);
}

function isTokenBlacklisted(token) {
  return blacklistedTokens.has(token);
}

module.exports = { blacklistToken, isTokenBlacklisted };
