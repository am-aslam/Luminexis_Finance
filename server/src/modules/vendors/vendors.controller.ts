import { Request, Response, NextFunction } from 'express';
import { VendorsService } from './vendors.service.js';
import { createVendorSchema, updateVendorSchema } from './vendors.schema.js';

export class VendorsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = createVendorSchema.parse(req.body);
      const result = await VendorsService.create(parsedData);

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
      const parsedData = updateVendorSchema.parse(req.body);
      const result = await VendorsService.update(id, parsedData);

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
      const result = await VendorsService.delete(id);

      return res.status(200).json({
        success: true,
        data: { id: result.id, message: 'Vendor record soft deleted successfully' }
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await VendorsService.list();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}
