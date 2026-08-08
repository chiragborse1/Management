import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export type TokenKind = 'refresh' | 'email_verification' | 'password_reset';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  kind: TokenKind;
  /** SHA-256 hash of the raw token — never store the token itself */
  tokenHash: string;
  /** Set when a rotated refresh token supersedes this one */
  replacedBy?: string;
  expiresAt: Date;
  revokedAt?: Date;
  /** Client metadata for auditing (device/ip) */
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['refresh', 'email_verification', 'password_reset'],
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    replacedBy: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 64,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookups for rotation + cleanup
tokenSchema.index({ userId: 1, kind: 1, revokedAt: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: auto-clean expired tokens

export const Token = mongoose.model<IToken>('Token', tokenSchema);
