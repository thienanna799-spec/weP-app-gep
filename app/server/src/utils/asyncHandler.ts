import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler and forwards any rejected promise
 * to Express's next(err) so the centralized error handler catches it.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
