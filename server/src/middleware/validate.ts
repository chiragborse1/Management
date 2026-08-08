import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodTypeAny } from 'zod';
import { fromZodError } from 'zod-validation-error';

/**
 * Express middleware that validates req.body / req.query / req.params
 * against a Zod schema. Accepts plain objects and refined/effect schemas.
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({
          error: 'Validation failed',
          details: validationError.details,
        });
        return;
      }
      next(error);
    }
  };
};
