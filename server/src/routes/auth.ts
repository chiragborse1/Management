import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/index.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshAccessToken)
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

// Protected routes
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
