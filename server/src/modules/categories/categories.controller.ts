import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';

export class CategoriesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = createCategorySchema.parse(req.body);
      const result = await CategoriesService.create(parsedData);

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
      const parsedData = updateCategorySchema.parse(req.body);
      const result = await CategoriesService.update(id, parsedData);

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
      const result = await CategoriesService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Category deleted successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoriesService.list();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
