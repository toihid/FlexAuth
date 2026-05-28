import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@flexauth/shared-types';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error internally with full details
  logger.error('Request error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known error types
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(400).json(response);
    return;
  }

  // Generic error — never expose internal details to client
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'AUTH_INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(500).json(response);
}
