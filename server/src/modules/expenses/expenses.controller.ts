import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service.js';
import { createExpenseSchema, updateExpenseSchema, queryExpensesSchema } from './expenses.schema.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class ExpensesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const parsedData = createExpenseSchema.parse(req.body);
      const result = await ExpensesService.create(parsedData, req.user.id);
      
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
      const parsedData = updateExpenseSchema.parse(req.body);
      const result = await ExpensesService.update(id, parsedData);

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
      const result = await ExpensesService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Expense record soft deleted successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ExpensesService.getById(id);

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
      const parsedQuery = queryExpensesSchema.parse(req.query);
      const result = await ExpensesService.list(parsedQuery);

      return res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta
      });
    } catch (err) {
      next(err);
    }
  }

  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      // Parse query params, but force page=1 and limit=10000 to extract all records
      const queryParams = {
        ...req.query,
        page: 1,
        limit: 10000
      };
      const parsedQuery = queryExpensesSchema.parse(queryParams);
      const result = await ExpensesService.list(parsedQuery);
      
      const buffer = ExpensesService.generateExcel(result.items);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Luminexis_Expenses.xlsx"');
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }
}
