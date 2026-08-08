import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import { User, Student } from '../models/User.js';
import { Token } from '../models/Token.js';
import { signAccessToken } from '../utils/jwt.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  isTokenValid,
  createEmailVerificationToken,
  createPasswordResetToken,
} from '../services/tokenService.js';
import { createNotification } from '../services/notificationService.js';

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    path: '/',
  };
  res.cookie('accessToken', tokens.accessToken, cookieOptions);
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

const getUserResponse = <T extends { password?: string }>(user: T): Omit<T, 'password'> => {
  const { password, ...rest } = user;
  void password;
  return rest;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, phone, password, role, studentId, hostelId, businessName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    throw AppError.conflict('User with this email or phone already exists', 'USER_EXISTS');
  }

  let user;

  switch (role) {
    // Create via the BASE model — mongoose routes to the right discriminator
    // from the `role` field (discriminatorKey). Passing role to the
    // discriminator model directly causes a cast error.
    case 'student': {
      if (!studentId) throw AppError.badRequest('Student ID is required for student role');
      const existingStudent = await Student.findOne({ studentId: studentId.toUpperCase() });
      if (existingStudent)
        throw AppError.conflict('Student ID already registered', 'STUDENT_EXISTS');
      user = await User.create({
        name,
        email,
        phone,
        password,
        role: 'student',
        studentId: studentId.toUpperCase(),
        hostelId: hostelId || undefined,
      });
      break;
    }
    case 'admin': {
      if (!hostelId) throw AppError.badRequest('Hostel ID is required for admin role');
      user = await User.create({
        name,
        email,
        phone,
        password,
        role: 'admin',
        hostelId,
        permissions: [],
      });
      break;
    }
    case 'mess_owner': {
      if (!businessName) throw AppError.badRequest('Business name is required for mess owner role');
      user = await User.create({
        name,
        email,
        phone,
        password,
        role: 'mess_owner',
        businessName,
      });
      break;
    }
    default:
      throw AppError.badRequest('Invalid role', 'INVALID_ROLE');
  }

  // Issue access token + persist an opaque refresh token (rotation-ready)
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refresh = await createRefreshToken(user._id.toString(), req);
  setAuthCookies(res, { accessToken, refreshToken: refresh.token });

  // Onboarding notification (also exercises the notification service)
  await createNotification({
    userId: user._id.toString(),
    type: 'system',
    title: 'Welcome to HostelSaaS 🎉',
    message: `Your ${role.replace('_', ' ')} account was created successfully.`,
  });

  // Refresh token lives ONLY in the HttpOnly cookie — never expose it to JS.
  sendSuccess(res, { user: getUserResponse(user.toObject()), accessToken }, 201, {
    message: 'Registration successful',
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw AppError.unauthorized('Account is deactivated', 'ACCOUNT_INACTIVE');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refresh = await createRefreshToken(user._id.toString(), req);

  const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : config.cookie.maxAge;
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: cookieMaxAge,
    path: '/',
  });
  res.cookie('refreshToken', refresh.token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: cookieMaxAge,
    path: '/',
  });

  sendSuccess(res, { user: getUserResponse(user.toObject()), accessToken }, 200, {
    message: 'Login successful',
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // Revoke the persisted refresh token so it can't be replayed after logout
  const refreshToken = req.cookies?.['refreshToken'] ?? req.body?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearAuthCookies(res);
  sendSuccess(res, null, 200, { message: 'Logged out successfully' });
};

/**
 * Refresh-token rotation endpoint. The presented refresh token is validated
 * against the Token store, revoked, and replaced with a fresh one.
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.['refreshToken'] ?? req.body?.refreshToken;
  if (!refreshToken)
    throw AppError.unauthorized('Refresh token required', 'REFRESH_TOKEN_REQUIRED');

  const stored = await rotateRefreshToken(refreshToken, req);

  // The token record carries the userId — fetch the user for fresh claims
  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('User not found or inactive', 'INVALID_REFRESH_TOKEN');
  }

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  setAuthCookies(res, { accessToken, refreshToken: stored.token });

  sendSuccess(res, { accessToken, refreshExpiresAt: stored.expiresAt });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = (req as Request & { user?: { toObject: () => object } }).user;
  if (!user) throw AppError.unauthorized('Not authenticated');
  sendSuccess(res, { user: getUserResponse(user.toObject()) });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;
  const valid = await isTokenValid(token, 'email_verification');
  if (!valid) throw AppError.badRequest('Invalid or expired verification token', 'INVALID_TOKEN');

  const record = await Token.findOne({ tokenHash: hashToken(token), kind: 'email_verification' });
  if (!record) throw AppError.badRequest('Invalid token', 'INVALID_TOKEN');

  await User.updateOne({ _id: record.userId }, { $set: { isEmailVerified: true } });
  record.revokedAt = new Date();
  await record.save();

  sendSuccess(res, null, 200, { message: 'Email verified successfully' });
};

export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user && !user.isEmailVerified) {
    const stored = await createEmailVerificationToken(user._id.toString(), req);
    // TODO: send verification link via email provider
    console.log(`[dev] Verification token for ${email}: ${stored.token}`);
  }
  // Always return 200 — don't leak whether the email is registered
  sendSuccess(res, null, 200, {
    message: 'If the account exists, a verification link has been sent',
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const stored = await createPasswordResetToken(user._id.toString(), req);
    // TODO: send reset link via email provider
    console.log(`[dev] Password reset token for ${email}: ${stored.token}`);
  }
  // Always return 200 to avoid leaking which emails are registered
  sendSuccess(res, null, 200, {
    message: 'If an account exists with that email, a reset link has been sent',
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword)
    throw AppError.badRequest('Passwords do not match', 'PASSWORD_MISMATCH');

  const valid = await isTokenValid(token, 'password_reset');
  if (!valid) throw AppError.badRequest('Invalid or expired reset token', 'INVALID_TOKEN');

  const record = await Token.findOne({ tokenHash: hashToken(token), kind: 'password_reset' });
  if (!record) throw AppError.badRequest('Invalid token', 'INVALID_TOKEN');

  const user = await User.findById(record.userId);
  if (!user) throw AppError.notFound('User not found');

  user.password = password;
  await user.save();

  // Invalidate all sessions on password reset
  await revokeAllUserTokens(user._id.toString());
  record.revokedAt = new Date();
  await record.save();

  sendSuccess(res, null, 200, { message: 'Password reset successfully. You can now sign in.' });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword)
    throw AppError.badRequest('Passwords do not match', 'PASSWORD_MISMATCH');

  const userId = (
    req as Request & { user?: { _id: { toString: () => string } } }
  ).user?._id?.toString();
  if (!userId) throw AppError.unauthorized('Not authenticated');

  const user = await User.findById(userId).select('+password');
  if (!user) throw AppError.notFound('User not found');

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid)
    throw AppError.unauthorized('Current password is incorrect', 'WRONG_PASSWORD');

  user.password = newPassword;
  await user.save();

  // Rotate all sessions — old refresh tokens stop working
  await revokeAllUserTokens(user._id.toString());
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refresh = await createRefreshToken(user._id.toString(), req);
  setAuthCookies(res, { accessToken, refreshToken: refresh.token });

  sendSuccess(res, null, 200, { message: 'Password changed successfully' });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const user = (req as Request & { user?: { _id: { toString: () => string } } }).user;
  if (!user) throw AppError.unauthorized('Not authenticated');

  const allowedFields = ['name', 'phone', 'avatar', 'address', 'parentPhone', 'emergencyContact'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!updated) throw AppError.notFound('User not found');

  sendSuccess(res, { user: getUserResponse(updated.toObject()) });
};
