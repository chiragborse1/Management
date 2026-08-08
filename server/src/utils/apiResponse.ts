import type { Response } from 'express';

/**
 * Consistent API envelope used by every endpoint:
 *   success: { success: true, data, message? }
 *   error:   { success: false, error: { code, message, details? } }
 * Controllers return `data` only; the envelope is applied here.
 */

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  options?: { message?: string; meta?: Record<string, unknown> }
): Response<SuccessEnvelope<T>> => {
  const body: SuccessEnvelope<T> = { success: true, data };
  if (options?.message) body.message = options.message;
  if (options?.meta) body.meta = options.meta;
  return res.status(statusCode).json(body);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): Response =>
  sendSuccess(res, data, 201, { message });
