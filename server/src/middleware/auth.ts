import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import type { IUser } from '../models/User.js';
import type { JwtPayload, UserRole } from '@shared/types';
import type mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: IUser & { _id: mongoose.Types.ObjectId };
  tokenPayload?: JwtPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch user from database
    const user = await User.findById(payload.userId).select('+password');
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.tokenPayload) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.tokenPayload.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const user = await User.findById(payload.userId);
        if (user && user.isActive) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }
    }
    next();
  } catch {
    // Continue without authentication
    next();
  }
};
