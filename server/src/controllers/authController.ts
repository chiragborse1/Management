import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, Student, Admin, MessOwner } from '../models/User.js';
import { generateTokens, verifyRefreshToken, verifyAccessToken } from '../utils/jwt.js';
import { config } from '../config/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
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

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, studentId, hostelId, businessName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email or phone already exists' });
      return;
    }

    let user;

    switch (role) {
      case 'student': {
        if (!studentId) {
          res.status(400).json({ error: 'Student ID is required for student role' });
          return;
        }
        const existingStudent = await Student.findOne({ studentId: studentId.toUpperCase() });
        if (existingStudent) {
          res.status(409).json({ error: 'Student ID already registered' });
          return;
        }
        user = await Student.create({
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
        if (!hostelId) {
          res.status(400).json({ error: 'Hostel ID is required for admin role' });
          return;
        }
        user = await Admin.create({
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
        if (!businessName) {
          res.status(400).json({ error: 'Business name is required for mess owner role' });
          return;
        }
        user = await MessOwner.create({
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
        res.status(400).json({ error: 'Invalid role' });
        return;
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookies
    setAuthCookies(res, tokens);

    // Return user data (without password)
    // `password: undefined` keeps the type intact while JSON.stringify omits it,
    // so the hash never reaches the client.
    const userResponse = { ...user.toObject(), password: undefined };

    res.status(201).json({
      message: 'Registration successful',
      user: userResponse,
      tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({ error: 'Account is deactivated' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Set cookies (longer expiry if rememberMe)
    if (rememberMe) {
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    } else {
      setAuthCookies(res, tokens);
    }

    // Return user data (without password)
    // `password: undefined` keeps the type intact while JSON.stringify omits it,
    // so the hash never reaches the client.
    const userResponse = { ...user.toObject(), password: undefined };

    res.json({
      message: 'Login successful',
      user: userResponse,
      tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.['hostel-saas']?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setAuthCookies(res, tokens);

    res.json({ tokens });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const allowedFields = ['name', 'phone', 'avatar', 'address', 'parentPhone', 'emergencyContact'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    // Invalidate all sessions by generating new tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setAuthCookies(res, tokens);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Sends a password-reset token to the user's email.
 * NOTE: Email delivery is stubbed — wire up your provider (e.g. Resend, SendGrid)
 * and return the token only in development environments.
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    // Always return 200 to avoid leaking which emails are registered
    if (!user) {
      res.json({ message: 'If an account exists with that email, a reset link has been sent' });
      return;
    }

    // Short-lived reset token
    const resetToken = jwt.sign(
      { userId: user._id.toString(), type: 'reset' },
      config.jwt.accessSecret,
      { expiresIn: '30m' }
    );

    // TODO: Send email with reset link (https://hostel-saas.com/reset-password?token=...)
    console.log(`[dev] Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If an account exists with that email, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

/** Validates the reset token and sets a new password. */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload || payload.type !== 'reset') {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
