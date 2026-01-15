import type { Request, Response, NextFunction } from 'express';

interface ErrorWithResponse extends Error {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export function errorHandler(
  err: ErrorWithResponse,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
