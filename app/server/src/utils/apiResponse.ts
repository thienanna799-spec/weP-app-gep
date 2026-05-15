import { Response } from 'express';

export const sendSuccess = (res: Response, data: unknown, statusCode = 200, message?: string): void => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, message: string, statusCode = 400): void => {
  res.status(statusCode).json({ success: false, message });
};
