import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/index.js';

const router = Router();

// Public routes — stricter rate limits to blunt brute-force / token-spraying
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshAccessToken)
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);
router.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail)
);
router.post(
  '/resend-verification',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.resendVerification)
);

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
