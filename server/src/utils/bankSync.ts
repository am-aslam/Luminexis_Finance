import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export const recalculateBalances = async (txClient: any = prisma) => {
  // Fetch all transactions ordered chronologically by date and creation time
  const transactions = await txClient.bankTransaction.findMany({
    orderBy: [
      { date: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  let running = new Prisma.Decimal(0);

  // Update running balance sequentially to maintain precision
  for (const tx of transactions) {
    const credit = tx.credit ? new Prisma.Decimal(tx.credit.toString()) : new Prisma.Decimal(0);
    const debit = tx.debit ? new Prisma.Decimal(tx.debit.toString()) : new Prisma.Decimal(0);
    
    running = running.add(credit).sub(debit);

    await txClient.bankTransaction.update({
      where: { id: tx.id },
      data: {
        balance: running
      }
    });
  }
};

export const syncExpenseTransaction = async (expense: any, txClient: any = prisma) => {
  // Get vendor detail if available to formulate description
  let vendorName = '';
  if (expense.vendorId) {
    const v = await txClient.vendor.findUnique({ where: { id: expense.vendorId } });
    if (v) vendorName = v.name;
  }

  const description = `Expense: ${vendorName || 'Out of pocket'} - ${expense.description}`;

  const existing = await txClient.bankTransaction.findFirst({
    where: { relatedExpenseId: expense.id }
  });

  if (expense.deletedAt || expense.status === 'PENDING') {
    // If pending or deleted, it has not cleared the bank yet
    if (existing) {
      await txClient.bankTransaction.delete({ where: { id: existing.id } });
    }
  } else {
    // Status is PAID/COMPLETED, insert or update bank debit
    if (existing) {
      await txClient.bankTransaction.update({
        where: { id: existing.id },
        data: {
          date: expense.date,
          debit: expense.totalAmount,
          description
        }
      });
    } else {
      await txClient.bankTransaction.create({
        data: {
          date: expense.date,
          type: 'EXPENSE',
          description,
          debit: expense.totalAmount,
          credit: 0,
          balance: 0,
          relatedExpenseId: expense.id
        }
      });
    }
  }

  await recalculateBalances(txClient);
};

export const syncIncomeTransaction = async (income: any, txClient: any = prisma) => {
  const description = `Income: ${income.description}`;

  const existing = await txClient.bankTransaction.findFirst({
    where: { relatedIncomeId: income.id }
  });

  if (income.deletedAt || income.status === 'PENDING') {
    if (existing) {
      await txClient.bankTransaction.delete({ where: { id: existing.id } });
    }
  } else {
    if (existing) {
      await txClient.bankTransaction.update({
        where: { id: existing.id },
        data: {
          date: income.date,
          credit: income.totalAmount,
          description
        }
      });
    } else {
      await txClient.bankTransaction.create({
        data: {
          date: income.date,
          type: 'INCOME',
          description,
          credit: income.totalAmount,
          debit: 0,
          balance: 0,
          relatedIncomeId: income.id
        }
      });
    }
  }

  await recalculateBalances(txClient);
};

export const syncCapitalTransaction = async (capital: any, contributorName: string, txClient: any = prisma) => {
  const ref = `capital_${capital.id}`;
  const description = `Capital: ${contributorName} (${capital.description})`;

  const existing = await txClient.bankTransaction.findFirst({
    where: { reference: ref }
  });

  if (capital.deletedAt) {
    if (existing) {
      await txClient.bankTransaction.delete({ where: { id: existing.id } });
    }
  } else {
    if (existing) {
      await txClient.bankTransaction.update({
        where: { id: existing.id },
        data: {
          date: capital.date,
          credit: capital.amount,
          description
        }
      });
    } else {
      await txClient.bankTransaction.create({
        data: {
          date: capital.date,
          type: 'CAPITAL',
          description,
          credit: capital.amount,
          debit: 0,
          balance: 0,
          reference: ref
        }
      });
    }
  }

  await recalculateBalances(txClient);
};
