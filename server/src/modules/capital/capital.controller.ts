import { Request, Response, NextFunction } from 'express';
import { CapitalService } from './capital.service.js';
import { createCapitalSchema, updateCapitalSchema } from './capital.schema.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class CapitalController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const parsedData = createCapitalSchema.parse(req.body);
      const result = await CapitalService.create(parsedData, req.user.id);

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
      const parsedData = updateCapitalSchema.parse(req.body);
      const result = await CapitalService.update(id, parsedData);

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
      const result = await CapitalService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Capital contribution record soft deleted successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CapitalService.list();

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
