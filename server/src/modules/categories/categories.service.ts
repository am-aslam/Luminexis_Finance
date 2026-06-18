import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

export class CategoriesService {
  static async create(data: { name: string; type: 'EXPENSE' | 'INCOME' }) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existing) {
      throw new ConflictError('Category name already exists');
    }

    return prisma.category.create({ data });
  }

  static async update(id: string, data: { name?: string; type?: 'EXPENSE' | 'INCOME' }) {
    const existing = await prisma.category.findUnique({
      where: { id }
    });
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.category.findUnique({
        where: { name: data.name }
      });
      if (nameConflict) {
        throw new ConflictError('Category name already exists');
      }

      // Check if old name is in use by active expenses or incomes
      const expenseCount = await prisma.expense.count({
        where: { category: existing.name, deletedAt: null }
      });
      const incomeCount = await prisma.income.count({
        where: { category: existing.name, deletedAt: null }
      });

      if (expenseCount > 0 || incomeCount > 0) {
        throw new ConflictError('Cannot rename category as it is currently in use by expenses or income');
      }
    }

    return prisma.category.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    const existing = await prisma.category.findUnique({
      where: { id }
    });
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    // Check if category name is used by active expenses or incomes
    const expenseCount = await prisma.expense.count({
      where: { category: existing.name, deletedAt: null }
    });
    const incomeCount = await prisma.income.count({
      where: { category: existing.name, deletedAt: null }
    });

    if (expenseCount > 0 || incomeCount > 0) {
      throw new ConflictError('Cannot delete category as it is currently in use by expenses or income');
    }

    return prisma.category.delete({
      where: { id }
    });
  }

  static async list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  }
}
