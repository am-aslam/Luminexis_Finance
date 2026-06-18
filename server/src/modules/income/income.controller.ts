import { Request, Response, NextFunction } from 'express';
import { IncomeService } from './income.service.js';
import { createIncomeSchema, updateIncomeSchema, queryIncomeSchema } from './income.schema.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class IncomeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const parsedData = createIncomeSchema.parse(req.body);
      const result = await IncomeService.create(parsedData, req.user.id);

      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsedData = updateIncomeSchema.parse(req.body);
      const result = await IncomeService.update(id, parsedData);

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
      const { id } = req.params;
      const result = await IncomeService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Income record soft deleted successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await IncomeService.getById(id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = queryIncomeSchema.parse(req.query);
      const result = await IncomeService.list(parsedQuery);

      return res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }
}
