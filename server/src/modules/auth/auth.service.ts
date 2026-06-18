import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, NotFoundError, ValidationError, ConflictError } from '../../utils/errors.js';

export class AuthService {
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  static async refresh(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: string;
        name: string;
      };

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw new UnauthorizedError('User no longer exists');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (err) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }
  }

  static async signup(data: any) {
    const userCount = await prisma.user.count();
    let role = 'FOUNDER';

    if (userCount > 0) {
      if (!data.inviteToken) {
        throw new ValidationError('An invitation token is required to register a co-founder account.');
      }

      const invitation = await prisma.invitation.findUnique({
        where: { token: data.inviteToken }
      });

      if (!invitation) {
        throw new NotFoundError('Invalid or expired invitation token.');
      }

      if (invitation.expiresAt < new Date()) {
        throw new ValidationError('This invitation has expired.');
      }

      if (invitation.email.toLowerCase() !== data.email.toLowerCase()) {
        throw new ValidationError('The email address provided does not match the invitation.');
      }

      role = invitation.role;

      // Clean up/accept the invitation
      await prisma.invitation.delete({ where: { id: invitation.id } });
    }

    // Check if email already exists
    const emailConflict = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (emailConflict) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role
      }
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  static async getUserProfile(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  private static generateAccessToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES as any }
    );
  }

  private static generateRefreshToken(user: any) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES as any }
    );
  }
}
