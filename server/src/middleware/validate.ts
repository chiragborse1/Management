import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/ApiError.js';

type ValidationSource = 'body' | 'query' | 'params';

/**
 * Express middleware that validates a request part against a Zod schema.
 *
 * Usage:
 *   validate(someBodySchema)            // validates req.body (default)
 *   validate(paginationSchema, 'query') // validates req.query
 *
 * Throws a VALIDATION_ERROR AppError (mapped to a 400 by the error handler).
 */
export const validate =
  (schema: ZodTypeAny, source: ValidationSource = 'body') =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          AppError.badRequest('Request validation failed', 'VALIDATION_ERROR', {
            issues: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          })
        );
        return;
      }
      next(error);
    }
  };
