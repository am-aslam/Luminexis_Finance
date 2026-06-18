import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export class VendorsService {
  static async create(data: any) {
    return prisma.vendor.create({ data });
  }

  static async update(id: string, data: any) {
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) throw new NotFoundError('Vendor not found');
    return prisma.vendor.update({ where: { id }, data });
  }

  static async delete(id: string) {
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) throw new NotFoundError('Vendor not found');

    const expensesCount = await prisma.expense.count({
      where: { vendorId: id, deletedAt: null }
    });
    if (expensesCount > 0) {
      throw new ConflictError('Cannot delete vendor as active expenses are linked to it');
    }

    return prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  static async list() {
    return prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    });
  }
}
