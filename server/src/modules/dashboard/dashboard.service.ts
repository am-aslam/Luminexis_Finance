import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class DashboardService {
  static async getSummary() {
    // 1. Sum Capital Injections
    const capitalSum = await prisma.capitalContribution.aggregate({
      where: { deletedAt: null },
      _sum: { amount: true }
    });
    const totalCapital = capitalSum._sum.amount || new Prisma.Decimal(0);

    // 2. Sum Gross Revenue Incomes
    const incomeSum = await prisma.income.aggregate({
      where: { deletedAt: null },
      _sum: { totalAmount: true }
    });
    const totalIncome = incomeSum._sum.totalAmount || new Prisma.Decimal(0);

    // 3. Sum Expenses
    const expenseSum = await prisma.expense.aggregate({
      where: { deletedAt: null },
      _sum: { totalAmount: true }
    });
    const totalExpenses = expenseSum._sum.totalAmount || new Prisma.Decimal(0);

    // 4. Net Burn: Income - Expenses
    const netBurn = totalIncome.sub(totalExpenses);

    // 5. Current liquid bank balance (latest running balance in the ledger)
    const latestLedger = await prisma.bankTransaction.findFirst({
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    const currentBalance = latestLedger ? latestLedger.balance : new Prisma.Decimal(0);

    // 6. Active months since first recorded transaction (to calculate monthly burn rate)
    let monthsActive = 1;
    const firstExpense = await prisma.expense.findFirst({
      where: { deletedAt: null },
      orderBy: { date: 'asc' }
    });
    const firstCapital = await prisma.capitalContribution.findFirst({
      where: { deletedAt: null },
      orderBy: { date: 'asc' }
    });
    const firstIncome = await prisma.income.findFirst({
      where: { deletedAt: null },
      orderBy: { date: 'asc' }
    });

    const dates = [
      firstExpense?.date,
      firstCapital?.date,
      firstIncome?.date
    ].filter((d): d is Date => !!d);

    if (dates.length > 0) {
      const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const now = new Date();
      const yearDiff = now.getFullYear() - earliestDate.getFullYear();
      const monthDiff = now.getMonth() - earliestDate.getMonth();
      const totalMonths = yearDiff * 12 + monthDiff;
      // Default to at least 1 month active to avoid division by zero or negative months
      monthsActive = Math.max(1, totalMonths + 1);
    }

    const burnRate = totalExpenses.dividedBy(monthsActive);
    const runway = burnRate.greaterThan(0) ? currentBalance.dividedBy(burnRate) : new Prisma.Decimal(999);

    // 7. Spending by Category (sorted descending)
    const categoriesSpending = await prisma.expense.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _sum: { totalAmount: true }
    });

    const expensesByCategory = categoriesSpending
      .map(c => ({
        category: c.category,
        total: c._sum.totalAmount ? c._sum.totalAmount.toString() : '0.00'
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    // 8. Daily Spend over the last 30 days (fill in missing dates with zero)
    const last30Days: { date: string; total: string }[] = [];
    const now = new Date();
    
    // Group spends by date using Prisma query or by filtering in javascript. 
    // Since records are few and localized, fetching dates directly is extremely quick and robust
    const startDate = new Date();
    startDate.setDate(now.getDate() - 30);

    const spends = await prisma.expense.findMany({
      where: {
        deletedAt: null,
        date: {
          gte: startDate,
          lte: now
        }
      },
      select: {
        date: true,
        totalAmount: true
      }
    });

    const dailySpendMap: { [key: string]: Prisma.Decimal } = {};
    spends.forEach(s => {
      const dateStr = s.date.toISOString().split('T')[0];
      const amt = new Prisma.Decimal(s.totalAmount);
      dailySpendMap[dateStr] = dailySpendMap[dateStr] ? dailySpendMap[dateStr].add(amt) : amt;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const total = dailySpendMap[dateStr] ? dailySpendMap[dateStr].toString() : '0.00';
      last30Days.push({ date: dateStr, total });
    }

    return {
      totalCapital: totalCapital.toString(),
      totalIncome: totalIncome.toString(),
      totalExpenses: totalExpenses.toString(),
      netBurn: netBurn.toString(),
      currentBalance: currentBalance.toString(),
      burnRate: burnRate.toFixed(2),
      runway: runway.toFixed(1),
      expensesByCategory,
      dailySpend: last30Days
    };
  }
}
