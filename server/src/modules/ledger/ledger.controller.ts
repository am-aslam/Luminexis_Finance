import { Request, Response, NextFunction } from 'express';
import { LedgerService } from './ledger.service.js';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.js';

export class LedgerController {
  static async getBankLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await LedgerService.getBankLedger(page, limit);
      return res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBankBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LedgerService.getBankBalance();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPersonalLedgerMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await LedgerService.getPersonalLedger(req.user.id);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPersonalLedgerUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      if (req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only administrators can access user specific founder ledgers');
      }

      const { userId } = req.params;
      const result = await LedgerService.getPersonalLedger(userId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
