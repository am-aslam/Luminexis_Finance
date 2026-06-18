import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend Express Request type definition
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing from authorization headers');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    next(new UnauthorizedError('Access token is invalid, expired, or corrupted'));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient role privileges for this endpoint'));
    }

    next();
  };
};
