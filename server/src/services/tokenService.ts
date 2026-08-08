import crypto from 'node:crypto';
import type { Request } from 'express';
import { Token } from '../models/Token.js';
import type { TokenKind } from '../models/Token.js';
import { AppError } from '../utils/ApiError.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (matches JWT refresh expiry)
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30m

/** SHA-256 hash of a token — tokens are only ever stored hashed. */
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const getClientMeta = (req: Request): { userAgent?: string; ipAddress?: string } => ({
  userAgent: req.headers['user-agent']?.slice(0, 300),
  ipAddress: req.ip?.slice(0, 64),
});

export interface StoredToken {
  token: string;
  expiresAt: Date;
}

/** Creates a random token, persists its hash, returns the raw token (once). */
const createStoredToken = async (
  userId: string,
  kind: TokenKind,
  ttlMs: number,
  req: Request
): Promise<StoredToken> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ttlMs);
  await Token.create({
    userId,
    kind,
    tokenHash: hashToken(token),
    expiresAt,
    ...getClientMeta(req),
  });
  return { token, expiresAt };
};

/** Issues a fresh opaque refresh token for a user (register / login / rotation). */
export const createRefreshToken = async (userId: string, req: Request): Promise<StoredToken> =>
  createStoredToken(userId, 'refresh', REFRESH_TOKEN_TTL_MS, req);

/** Validates a raw token hash exists, is unrevoked and unexpired. */
export const isTokenValid = async (token: string, kind: TokenKind): Promise<boolean> => {
  const record = await Token.findOne({ tokenHash: hashToken(token), kind });
  if (!record || record.revokedAt) return false;
  if (record.expiresAt.getTime() < Date.now()) return false;
  return true;
};

/**
 * Refresh-token rotation:
 * 1. Validates the presented refresh token.
 * 2. Revokes it and issues a brand-new one (rotation defeats replay attacks).
 * 3. Returns the new raw token.
 */
export const rotateRefreshToken = async (
  oldToken: string,
  req: Request
): Promise<StoredToken & { userId: string }> => {
  const record = await Token.findOne({ tokenHash: hashToken(oldToken), kind: 'refresh' });
  if (!record || record.revokedAt) {
    throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    // Expired token — revoke it so a leaked token can't be replayed
    record.revokedAt = new Date();
    await record.save();
    throw AppError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
  }

  // Revoke old, issue new
  const next = await createStoredToken(
    record.userId.toString(),
    'refresh',
    REFRESH_TOKEN_TTL_MS,
    req
  );
  record.revokedAt = new Date();
  record.replacedBy = hashToken(next.token);
  await record.save();

  return { ...next, userId: record.userId.toString() };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  const record = await Token.findOne({ tokenHash: hashToken(token), kind: 'refresh' });
  if (record && !record.revokedAt) {
    record.revokedAt = new Date();
    await record.save();
  }
};

/** Revokes every refresh token for a user (used on password change / account lock). */
export const revokeAllUserTokens = async (
  userId: string,
  kind: TokenKind = 'refresh'
): Promise<void> => {
  await Token.updateMany({ userId, kind, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

export const createEmailVerificationToken = async (
  userId: string,
  req: Request
): Promise<StoredToken> =>
  createStoredToken(userId, 'email_verification', VERIFICATION_TOKEN_TTL_MS, req);

export const createPasswordResetToken = async (
  userId: string,
  req: Request
): Promise<StoredToken> => createStoredToken(userId, 'password_reset', RESET_TOKEN_TTL_MS, req);
