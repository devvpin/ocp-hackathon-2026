/**
 * validate.js — Request body / query / params validation middleware using Zod.
 *
 * Usage:
 *   router.post('/resource', validate(myZodSchema), handler)
 *
 * On failure: returns 422 with field-level error details.
 * On success: attaches the parsed (coerced) data to req.validated.
 *
 * `target` controls which part of the request to validate:
 *   'body' (default) | 'query' | 'params'
 */

const { sendError } = require('../utils/response');

/**
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [target='body']
 */
function validate(schema, target = 'body') {
  return (req, res, next) => {
    const input = req[target];
    const result = schema.safeParse(input);

    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed.', details);
    }

    // Attach the parsed (coerced/transformed) data for the handler to use
    req.validated = req.validated || {};
    req.validated[target] = result.data;

    next();
  };
}

module.exports = validate;
