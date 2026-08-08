/**
 * Operational error with an HTTP status + machine-readable code.
 * Throw inside controllers; the global error handler (middleware/errorHandler.ts)
 * maps it to a consistent JSON envelope.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    // Keep the prototype chain intact for ES2015+ transpilation targets
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): AppError {
    return new AppError(401, message, code);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): AppError {
    return new AppError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): AppError {
    return new AppError(404, message, code);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details?: unknown): AppError {
    return new AppError(409, message, code, details);
  }

  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED'): AppError {
    return new AppError(429, message, code);
  }
}
