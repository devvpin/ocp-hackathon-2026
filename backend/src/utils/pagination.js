/**
 * pagination.js — Shared pagination utility.
 *
 * Parses `?page=` and `?limit=` query params and returns
 * the Prisma `skip`/`take` values plus normalised meta fields.
 *
 * Defaults: page=1, limit=20. Maximum limit=100.
 */

/**
 * @param {import('express').Request['query']} query
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

/**
 * Builds the meta object for sendList.
 * @param {{ page: number, limit: number }} pagination
 * @param {number} total  Total record count (from Prisma count)
 */
function buildMeta(pagination, total) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

module.exports = { parsePagination, buildMeta };
