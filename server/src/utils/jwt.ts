import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { JwtPayload } from '@shared/types';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: JwtPayload['role'];
}

/**
 * Signs a short-lived access token. Refresh tokens are NOT JWTs —
 * they are opaque random strings stored hashed in the Token collection
 * (see services/tokenService.ts) so they can be revoked/rotated.
 */
export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
