import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error (stack trace only in development)
  if (req.log) {
    req.log.error(isProd ? { message: err.message, code: err.code } : err);
  } else {
    console.error(isProd ? `[ERROR] ${err.message}` : (err.stack || err));
  }

  // ── Custom AppError hierarchy ────────────────────────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      }
    });
  }

  // ── Zod validation errors ────────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const message = `Validation failed: ${details.map(d => `${d.field}: ${d.message}`).join(', ')}`;
    return res.status(400).json({
      success: false,
      message,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      }
    });
  }

  // ── Prisma known errors ──────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A unique constraint was violated. This account might already exist.',
        error: {
          code: 'CONFLICT',
          message: 'Database unique constraint violated',
          details: isProd ? [] : [{ target: err.meta?.target }],
        }
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Requested record not found.',
        error: {
          code: 'NOT_FOUND',
          message: 'Requested database record not found',
        }
      });
    }
  }

  // ── CORS errors ──────────────────────────────────────────────────────────────
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      message: 'Cross-origin request blocked.',
      error: {
        code: 'CORS_ERROR',
        message: isProd ? 'Cross-origin request blocked.' : err.message,
      }
    });
  }

  // ── Fallback 500 ─────────────────────────────────────────────────────────────
  return res.status(500).json({
    success: false,
    message: isProd
      ? 'An unexpected server error occurred. Please try again later.'
      : (err.message || 'An unexpected server error occurred'),
    error: {
      code: 'SERVER_ERROR',
      message: isProd
        ? 'Internal Server Error'
        : (err.message || 'An unexpected server error occurred'),
    }
  });
};
