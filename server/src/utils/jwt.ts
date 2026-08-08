import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { JwtPayload } from '@shared/types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(payload: Omit<JwtPayload, 'type'>): TokenPair {
  const accessToken = jwt.sign({ ...payload, type: 'access' }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}
