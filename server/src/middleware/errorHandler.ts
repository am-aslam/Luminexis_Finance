import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error using the Pino request logger if attached, else fallback to console
  if (req.log) {
    req.log.error(err);
  } else {
    console.error('Server exception caught:', err.stack || err);
  }

  // Handle custom AppError hierarchy
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle Zod validation parsing errors
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    const message = `Validation failed: ${details.map(d => `${d.field}: ${d.message}`).join(', ')}`;
    return res.status(400).json({
      success: false,
      message,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details
      }
    });
  }

  // Handle Prisma Database Client Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const message = 'A unique constraint was violated. This account might already exist.';
      return res.status(409).json({
        success: false,
        message,
        error: {
          code: 'CONFLICT',
          message: 'Database unique constraint violated',
          details: [{ target: err.meta?.target }]
        }
      });
    }
    if (err.code === 'P2025') {
      const message = 'Requested database record not found.';
      return res.status(404).json({
        success: false,
        message,
        error: {
          code: 'NOT_FOUND',
          message: 'Requested database record not found'
        }
      });
    }
  }

  // Fallback default Server Error
  return res.status(500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred',
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'An unexpected server error occurred'
    }
  });
};
