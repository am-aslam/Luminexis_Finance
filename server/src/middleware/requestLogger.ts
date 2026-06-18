import { pino } from 'pino';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Extend Express Request context
declare global {
  namespace Express {
    interface Request {
      log?: any;
    }
  }
}

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard'
    }
  } : undefined
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Create a logger child instance for tracing this request
  req.log = logger.child({ 
    requestId: Math.random().toString(36).substring(2, 9) 
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    }, `HTTP ${req.method} ${req.originalUrl} - ${res.statusCode} in ${duration}ms`);
  });

  next();
};
