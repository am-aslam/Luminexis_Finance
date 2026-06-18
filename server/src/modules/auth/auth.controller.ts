import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../utils/errors.js';

const loginSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const signupSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
  inviteToken: z.string().optional()
});

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = signupSchema.parse(req.body);
      const result = await AuthService.signup(parsedData);

      // Set httpOnly cookie for refresh token
      res.setHeader('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure=${env.NODE_ENV === 'production' ? 'true' : 'false'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

      return res.status(201).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);

      // Set httpOnly cookie for refresh token
      res.setHeader('Set-Cookie', `refreshToken=${result.refreshToken}; HttpOnly; Secure=${env.NODE_ENV === 'production' ? 'true' : 'false'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`);

      return res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Direct cookie parsing from header to avoid external parser dependency
      const cookieHeader = req.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const parts = c.trim().split('=');
          return [parts[0], parts.slice(1).join('=')];
        })
      );

      const refreshToken = cookies['refreshToken'];
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is missing from client cookies');
      }

      const result = await AuthService.refresh(refreshToken);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear cookie by setting expired age
      res.setHeader('Set-Cookie', `refreshToken=; HttpOnly; Secure=${env.NODE_ENV === 'production' ? 'true' : 'false'}; SameSite=Strict; Max-Age=0; Path=/`);
      
      return res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const user = await AuthService.getUserProfile(req.user.id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }
}
