import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DashboardService.getSummary();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
