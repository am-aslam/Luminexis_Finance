import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { calculateGST } from '../../utils/gst.js';
import { syncExpenseTransaction } from '../../utils/bankSync.js';
import { NotFoundError } from '../../utils/errors.js';
import XLSX from 'xlsx';

export class ExpensesService {
  static async create(data: any, userId: string) {
    const { gstAmount, totalAmount } = calculateGST(data.baseAmount, data.gstPercent);

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          date: data.date,
          category: data.category,
          vendorId: data.vendorId || null,
          description: data.description,
          baseAmount: new Prisma.Decimal(data.baseAmount),
          gstPercent: new Prisma.Decimal(data.gstPercent),
          gstAmount: new Prisma.Decimal(gstAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentMethod: data.paymentMethod,
          status: data.status,
          paidById: userId,
          notes: data.notes || null
        },
        include: { vendor: true, paidBy: true }
      });

      // Synchronize changes to Bank Ledger
      await syncExpenseTransaction(exp, tx);
      return exp;
    });

    return formatExpense(expense);
  }

  static async update(id: string, data: any) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) {
      throw new NotFoundError('Expense record not found');
    }

    // Determine values to compute GST
    const baseAmount = data.baseAmount !== undefined ? data.baseAmount : Number(existing.baseAmount);
    const gstPercent = data.gstPercent !== undefined ? data.gstPercent : Number(existing.gstPercent);
    const { gstAmount, totalAmount } = calculateGST(baseAmount, gstPercent);

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.update({
        where: { id },
        data: {
          date: data.date,
          category: data.category,
          vendorId: data.vendorId !== undefined ? data.vendorId : existing.vendorId,
          description: data.description,
          baseAmount: new Prisma.Decimal(baseAmount),
          gstPercent: new Prisma.Decimal(gstPercent),
          gstAmount: new Prisma.Decimal(gstAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          paymentMethod: data.paymentMethod,
          status: data.status,
          notes: data.notes !== undefined ? data.notes : existing.notes
        },
        include: { vendor: true, paidBy: true }
      });

      await syncExpenseTransaction(exp, tx);
      return exp;
    });

    return formatExpense(expense);
  }

  static async delete(id: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null }
    });
    if (!existing) {
      throw new NotFoundError('Expense record not found');
    }

    const expense = await prisma.$transaction(async (tx) => {
      // Perform Soft Delete
      const exp = await tx.expense.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await syncExpenseTransaction(exp, tx);
      return exp;
    });

    return formatExpense(expense);
  }

  static async getById(id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include: { vendor: true, paidBy: true }
    });
    if (!expense) {
      throw new NotFoundError('Expense record not found');
    }
    return formatExpense(expense);
  }

  static async list(filters: any) {
    const { 
      category, 
      dateFrom, 
      dateTo, 
      paidBy, 
      status, 
      paymentMethod,
      page,
      limit,
      sortBy,
      sortOrder
    } = filters;

    // Build Prisma query clauses
    const whereClause: Prisma.ExpenseWhereInput = {
      deletedAt: null
    };

    if (category) {
      whereClause.category = category;
    }
    if (status) {
      whereClause.status = status;
    }
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }
    if (paidBy) {
      whereClause.paidBy = {
        name: { contains: paidBy }
      };
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

    const total = await prisma.expense.count({ where: whereClause });

    // Determine sorting key
    let orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
    if (sortBy === 'totalAmount') {
      orderBy = { totalAmount: sortOrder };
    } else if (sortBy === 'category') {
      orderBy = { category: sortOrder };
    } else {
      orderBy = { date: sortOrder };
    }

    const items = await prisma.expense.findMany({
      where: whereClause,
      include: { vendor: true, paidBy: { select: { id: true, name: true, email: true, role: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      items: items.map(formatExpense),
      meta: {
        page,
        limit,
        total
      }
    };
  }

  static generateExcel(items: any[]) {
    const data = items.map(exp => ({
      ID: exp.id,
      Date: exp.date.toISOString().split('T')[0],
      Category: exp.category,
      Vendor: exp.vendor?.name || 'N/A',
      Description: exp.description,
      'Base Amount (INR)': Number(exp.baseAmount),
      'GST (%)': Number(exp.gstPercent),
      'GST Amount (INR)': Number(exp.gstAmount),
      'Total Amount (INR)': Number(exp.totalAmount),
      'Payment Method': exp.paymentMethod,
      'Paid By': exp.paidBy?.name || 'N/A',
      Status: exp.status,
      Notes: exp.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses Log');

    // Auto fit column widths
    const maxLen = data.reduce((acc, row) => {
      Object.keys(row).forEach((key, idx) => {
        const valStr = String((row as any)[key] || '');
        acc[idx] = Math.max(acc[idx] || 0, valStr.length, key.length);
      });
      return acc;
    }, [] as number[]);
    worksheet['!cols'] = maxLen.map(len => ({ wch: len + 3 }));

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}

function formatExpense(exp: any) {
  if (!exp) return exp;
  return {
    ...exp,
    baseAmount: exp.baseAmount.toString(),
    gstPercent: exp.gstPercent.toString(),
    gstAmount: exp.gstAmount.toString(),
    totalAmount: exp.totalAmount.toString()
  };
}
