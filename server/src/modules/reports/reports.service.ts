import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { ValidationError } from '../../utils/errors.js';

export class ReportsService {
  static async getMonthlyReport(monthStr: string) {
    // Validate month string (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(monthStr)) {
      throw new ValidationError('Invalid month format. Expected YYYY-MM');
    }

    const [yearPart, monthPart] = monthStr.split('-').map(Number);
    if (monthPart < 1 || monthPart > 12) {
      throw new ValidationError('Invalid month value. Must be between 01 and 12');
    }

    // Determine start and end date of the month (in UTC or local, let's construct UTC ranges)
    const startDate = new Date(Date.UTC(yearPart, monthPart - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearPart, monthPart, 0, 23, 59, 59, 999));

    // 1. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        vendor: true,
        paidBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 2. Fetch Incomes
    const incomes = await prisma.income.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        paidBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 3. Fetch Capital Contributions
    const capitalContributions = await prisma.capitalContribution.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        contributor: { select: { id: true, name: true, email: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Calculations: Summary
    let totalIncome = new Prisma.Decimal(0);
    incomes.forEach(inc => {
      totalIncome = totalIncome.add(new Prisma.Decimal(inc.totalAmount));
    });

    let totalExpenses = new Prisma.Decimal(0);
    let totalGSTPaid = new Prisma.Decimal(0);
    expenses.forEach(exp => {
      totalExpenses = totalExpenses.add(new Prisma.Decimal(exp.totalAmount));
      totalGSTPaid = totalGSTPaid.add(new Prisma.Decimal(exp.gstAmount));
    });

    const netSavings = totalIncome.sub(totalExpenses);

    let totalCapitalContribution = new Prisma.Decimal(0);
    capitalContributions.forEach(cap => {
      totalCapitalContribution = totalCapitalContribution.add(new Prisma.Decimal(cap.amount));
    });

    // Calculations: Category Breakdowns (Expenses)
    const expenseCategoryMap: { [key: string]: { totalAmount: Prisma.Decimal; gstAmount: Prisma.Decimal; count: number } } = {};
    expenses.forEach(exp => {
      const cat = exp.category;
      if (!expenseCategoryMap[cat]) {
        expenseCategoryMap[cat] = {
          totalAmount: new Prisma.Decimal(0),
          gstAmount: new Prisma.Decimal(0),
          count: 0
        };
      }
      expenseCategoryMap[cat].totalAmount = expenseCategoryMap[cat].totalAmount.add(new Prisma.Decimal(exp.totalAmount));
      expenseCategoryMap[cat].gstAmount = expenseCategoryMap[cat].gstAmount.add(new Prisma.Decimal(exp.gstAmount));
      expenseCategoryMap[cat].count += 1;
    });

    const expensesByCategory = Object.entries(expenseCategoryMap).map(([category, stats]) => ({
      category,
      totalAmount: stats.totalAmount.toString(),
      gstAmount: stats.gstAmount.toString(),
      count: stats.count
    })).sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));

    // Calculations: Category Breakdowns (Incomes)
    const incomeCategoryMap: { [key: string]: { totalAmount: Prisma.Decimal; count: number } } = {};
    incomes.forEach(inc => {
      const cat = inc.category;
      if (!incomeCategoryMap[cat]) {
        incomeCategoryMap[cat] = {
          totalAmount: new Prisma.Decimal(0),
          count: 0
        };
      }
      incomeCategoryMap[cat].totalAmount = incomeCategoryMap[cat].totalAmount.add(new Prisma.Decimal(inc.totalAmount));
      incomeCategoryMap[cat].count += 1;
    });

    const incomeByCategory = Object.entries(incomeCategoryMap).map(([category, stats]) => ({
      category,
      totalAmount: stats.totalAmount.toString(),
      count: stats.count
    })).sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));

    // Calculations: Payment Methods (Expenses)
    const expensePaymentMap: { [key: string]: Prisma.Decimal } = {};
    expenses.forEach(exp => {
      const method = exp.paymentMethod;
      expensePaymentMap[method] = (expensePaymentMap[method] || new Prisma.Decimal(0)).add(new Prisma.Decimal(exp.totalAmount));
    });
    const expensesByPaymentMethod = Object.entries(expensePaymentMap).map(([method, total]) => ({
      method,
      total: total.toString()
    }));

    // Detail Items list: sorted chronologically
    const details: any[] = [];
    expenses.forEach(exp => {
      details.push({
        id: exp.id,
        date: exp.date,
        type: 'EXPENSE',
        description: exp.description,
        category: exp.category,
        totalAmount: exp.totalAmount.toString(),
        gstAmount: exp.gstAmount.toString(),
        paymentMethod: exp.paymentMethod,
        status: exp.status,
        vendor: exp.vendor ? exp.vendor.name : null,
        paidBy: exp.paidBy.name
      });
    });

    incomes.forEach(inc => {
      details.push({
        id: inc.id,
        date: inc.date,
        type: 'INCOME',
        description: inc.description,
        category: inc.category,
        totalAmount: inc.totalAmount.toString(),
        gstAmount: '0.00',
        paymentMethod: inc.paymentMethod,
        status: inc.status,
        vendor: null,
        paidBy: inc.paidBy.name
      });
    });

    capitalContributions.forEach(cap => {
      details.push({
        id: cap.id,
        date: cap.date,
        type: 'CAPITAL',
        description: cap.description,
        category: 'Capital Contribution',
        totalAmount: cap.amount.toString(),
        gstAmount: '0.00',
        paymentMethod: cap.paymentMethod,
        status: 'COMPLETED',
        vendor: null,
        paidBy: cap.contributor.name
      });
    });

    details.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });

    return {
      month: monthStr,
      summary: {
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        netSavings: netSavings.toString(),
        totalGSTPaid: totalGSTPaid.toString(),
        totalCapitalContribution: totalCapitalContribution.toString()
      },
      transactionsCount: {
        expensesCount: expenses.length,
        incomeCount: incomes.length,
        capitalCount: capitalContributions.length,
        totalCount: expenses.length + incomes.length + capitalContributions.length
      },
      expensesByCategory,
      incomeByCategory,
      expensesByPaymentMethod,
      details
    };
  }
}
