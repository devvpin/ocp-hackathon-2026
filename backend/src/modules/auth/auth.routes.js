'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const prisma = require('../../config/db');
const { signToken } = require('../../config/jwt');
const { requireAuth } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { AppError } = require('../../middleware/errorHandler');
const { sendSuccess } = require('../../utils/response');
const { blacklistToken } = require('../../utils/authTokens');

const PASSWORD_COST = 12;

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts. Please try again later.',
        details: [],
      },
    }),
});

router.use(authLimiter);

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Email must be valid.').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email must be valid.').toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
});

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isArchived: user.isArchived,
    createdAt: user.createdAt,
  };
}

function buildAuthResponse(user) {
  const safeUser = serializeUser(user);
  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return { user: safeUser, token };
}

router.post('/signup', validate(signupSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated.body;
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      throw new AppError(
        'FORBIDDEN',
        'Self signup is disabled. Ask an admin to create your employee account.'
      );
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_COST);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'admin',
      },
    });

    return sendSuccess(res, 201, buildAuthResponse(user));
  } catch (err) {
    return next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.');
    }

    if (user.isArchived) {
      throw new AppError('ACCOUNT_ARCHIVED', 'This account has been archived.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.');
    }

    return sendSuccess(res, 200, buildAuthResponse(user));
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  blacklistToken(req.token);
  return sendSuccess(res, 200, { loggedOut: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authenticated user no longer exists.');
    }

    if (user.isArchived) {
      throw new AppError('ACCOUNT_ARCHIVED', 'This account has been archived.');
    }

    return sendSuccess(res, 200, { user: serializeUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.patch('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.validated.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authenticated user no longer exists.');
    }

    if (user.isArchived) {
      throw new AppError('ACCOUNT_ARCHIVED', 'This account has been archived.');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('UNAUTHORIZED', 'Current password is incorrect.');
    }

    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_COST);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return sendSuccess(res, 200, { changed: true });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
