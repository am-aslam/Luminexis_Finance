import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { recalculateBalances } from '../../utils/bankSync.js';

export class LedgerService {
  static async createBankTransaction(data: any) {
    const tx = await prisma.$transaction(async (txClient) => {
      const created = await txClient.bankTransaction.create({
        data: {
          date: new Date(data.date),
          type: data.type || 'MANUAL',
          description: data.description,
          debit: new Prisma.Decimal(data.debit || 0),
          credit: new Prisma.Decimal(data.credit || 0),
          balance: new Prisma.Decimal(0)
        }
      });
      await recalculateBalances(txClient);
      return created;
    });
    return tx;
  }

  static async updateBankTransaction(id: string, data: any) {
    const tx = await prisma.$transaction(async (txClient) => {
      const updated = await txClient.bankTransaction.update({
        where: { id },
        data: {
          date: data.date ? new Date(data.date) : undefined,
          description: data.description,
          debit: data.debit !== undefined ? new Prisma.Decimal(data.debit) : undefined,
          credit: data.credit !== undefined ? new Prisma.Decimal(data.credit) : undefined,
          type: data.type
        }
      });
      await recalculateBalances(txClient);
      return updated;
    });
    return tx;
  }

  static async deleteBankTransaction(id: string) {
    const tx = await prisma.$transaction(async (txClient) => {
      const deleted = await txClient.bankTransaction.delete({
        where: { id }
      });
      await recalculateBalances(txClient);
      return deleted;
    });
    return tx;
  }

  static async getBankLedger(page: number = 1, limit: number = 20) {
    const total = await prisma.bankTransaction.count();
    
    const items = await prisma.bankTransaction.findMany({
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const mappedItems = items.map(item => ({
      ...item,
      debit: item.debit.toString(),
      credit: item.credit.toString(),
      balance: item.balance.toString()
    }));

    return {
      items: mappedItems,
      meta: {
        page,
        limit,
        total
      }
    };
  }

  static async getBankBalance() {
    const latestTx = await prisma.bankTransaction.findFirst({
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const balance = latestTx ? latestTx.balance.toString() : '0.00';
    return { currentBalance: balance };
  }

  static async getPersonalLedger(userId: string) {
    // 1. Fetch all non-deleted expenses paid by this user
    const expenses = await prisma.expense.findMany({
      where: { paidById: userId, deletedAt: null },
      include: { vendor: true }
    });

    // 2. Fetch all non-deleted income entries recorded by this user
    const incomes = await prisma.income.findMany({
      where: { paidById: userId, deletedAt: null }
    });

    // 3. Map both to a unified virtual ledger format
    const ledgerItems: any[] = [];

    expenses.forEach(exp => {
      ledgerItems.push({
        id: exp.id,
        date: exp.date,
        type: 'debit',
        category: exp.category,
        description: `Expense: ${exp.vendor?.name || 'Out of pocket'} - ${exp.description}`,
        amount: exp.totalAmount,
        createdAt: exp.createdAt
      });
    });

    incomes.forEach(inc => {
      ledgerItems.push({
        id: inc.id,
        date: inc.date,
        type: 'credit',
        category: inc.category,
        description: `Income: ${inc.description}`,
        amount: inc.totalAmount,
        createdAt: inc.createdAt
      });
    });

    // 4. Sort chronologically (oldest first for balance progression)
    ledgerItems.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // 5. Compute running balance
    let running = new Prisma.Decimal(0);
    const mapped = ledgerItems.map(item => {
      const amtDec = new Prisma.Decimal(item.amount.toString());
      if (item.type === 'credit') {
        running = running.add(amtDec);
      } else {
        running = running.sub(amtDec);
      }

      return {
        id: item.id,
        date: item.date.toISOString(),
        type: item.type,
        category: item.category,
        description: item.description,
        amount: item.amount.toString(),
        balance: running.toString()
      };
    });

    // Reverse mapped items to show newest entries first to matching typical dashboard lists
    return mapped.reverse();
  }
}
