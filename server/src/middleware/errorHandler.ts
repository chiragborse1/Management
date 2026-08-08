import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { AppError } from '../utils/ApiError.js';
import { config } from '../config/index.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

/** 404 for unknown routes — must be mounted after all routes. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
};

/**
 * Central error handler. Maps every error type to the API envelope:
 *   { success: false, error: { code, message, details? } }
 * Unknown errors return 500 and never leak stack traces to clients.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // Express requires 4 args to recognize the error middleware
  _next: NextFunction
): void => {
  // --- Known operational errors ---
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // --- Zod validation ---
  if (err instanceof ZodError) {
    const validationError = fromZodError(err);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationError.details,
      },
    });
    return;
  }

  // --- Mongoose ---
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Data validation failed', details },
    });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: `Invalid ${err.path}: ${err.value}` },
    });
    return;
  }
  // Duplicate key (unique index violation)
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field';
    res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_KEY', message: `${field} already exists` },
    });
    return;
  }

  // --- JWT ---
  if (err instanceof TokenExpiredError) {
    res
      .status(401)
      .json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' } });
    return;
  }
  if (err instanceof JsonWebTokenError) {
    res
      .status(401)
      .json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
    return;
  }

  // --- Unknown ---
  console.error('[errorHandler]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : 'Internal server error',
    },
  });
};
