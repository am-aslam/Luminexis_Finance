import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { syncIncomeTransaction } from '../../utils/bankSync.js';
import { NotFoundError } from '../../utils/errors.js';

export class IncomeService {
  static async create(data: any, userId: string) {
    const income = await prisma.$transaction(async (tx) => {
      const inc = await tx.income.create({
        data: {
          date: data.date,
          category: data.category,
          description: data.description,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          paymentMethod: data.paymentMethod,
          status: data.status,
          paidById: userId
        },
        include: { paidBy: true }
      });

      await syncIncomeTransaction(inc, tx);
      return inc;
    });

    return formatIncome(income);
  }

  static async update(id: string, data: any) {
    const existing = await prisma.income.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) {
      throw new NotFoundError('Income record not found');
    }

    const income = await prisma.$transaction(async (tx) => {
      const inc = await tx.income.update({
        where: { id },
        data: {
          date: data.date,
          category: data.category,
          description: data.description,
          totalAmount: data.totalAmount !== undefined ? new Prisma.Decimal(data.totalAmount) : undefined,
          paymentMethod: data.paymentMethod,
          status: data.status
        },
        include: { paidBy: true }
      });

      await syncIncomeTransaction(inc, tx);
      return inc;
    });

    return formatIncome(income);
  }

  static async delete(id: string) {
    const existing = await prisma.income.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) {
      throw new NotFoundError('Income record not found');
    }

    const income = await prisma.$transaction(async (tx) => {
      const inc = await tx.income.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await syncIncomeTransaction(inc, tx);
      return inc;
    });

    return formatIncome(income);
  }

  static async getById(id: string) {
    const income = await prisma.income.findFirst({
      where: { id, deletedAt: null },
      include: { paidBy: true }
    });
    if (!income) {
      throw new NotFoundError('Income record not found');
    }
    return formatIncome(income);
  }

  static async list(filters: any) {
    const { category, dateFrom, dateTo, status, page, limit } = filters;

    const whereClause: Prisma.IncomeWhereInput = {
      deletedAt: null
    };

    if (category) {
      whereClause.category = category;
    }
    if (status) {
      whereClause.status = status;
    }
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date.gte = dateFrom;
      }
      if (dateTo) {
        whereClause.date.lte = dateTo;
      }
    }

    const total = await prisma.income.count({ where: whereClause });

    const items = await prisma.income.findMany({
      where: whereClause,
      include: { paidBy: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      items: items.map(formatIncome),
      meta: {
        page,
        limit,
        total
      }
    };
  }
}

function formatIncome(inc: any) {
  if (!inc) return inc;
  return {
    ...inc,
    totalAmount: inc.totalAmount.toString()
  };
}
