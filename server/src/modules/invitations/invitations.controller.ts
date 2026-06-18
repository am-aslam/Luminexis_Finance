import { Request, Response, NextFunction } from 'express';
import { InvitationsService } from './invitations.service.js';
import { createInvitationSchema } from './invitations.schema.js';
import { ForbiddenError, UnauthorizedError } from '../../utils/errors.js';

export class InvitationsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (req.user.role !== 'FOUNDER' && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only founders or administrators can send invitations.');
      }

      const parsedData = createInvitationSchema.parse(req.body);
      const result = await InvitationsService.create(parsedData);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDetailsByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await InvitationsService.getDetailsByToken(token);

      return res.status(200).json({
        success: true,
        data: {
          email: result.email,
          role: result.role,
          expiresAt: result.expiresAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await InvitationsService.list();

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (req.user.role !== 'FOUNDER' && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only founders or administrators can revoke invitations.');
      }

      const { id } = req.params;
      const result = await InvitationsService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Invitation revoked successfully.' }
      });
    } catch (err) {
      next(err);
    }
  }
}
