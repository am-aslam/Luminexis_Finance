import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { ValidationError } from '../../utils/errors.js';

export class ReportsController {
  static async getMonthlyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { month } = req.query;
      if (!month || typeof month !== 'string') {
        throw new ValidationError('Query parameter "month" (YYYY-MM) is required');
      }

      const result = await ReportsService.getMonthlyReport(month);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
