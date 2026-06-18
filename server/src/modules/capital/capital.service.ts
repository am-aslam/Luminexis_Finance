import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { syncCapitalTransaction } from '../../utils/bankSync.js';
import { NotFoundError } from '../../utils/errors.js';

export class CapitalService {
  static async create(data: any, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Contributor user not found');

    const capital = await prisma.$transaction(async (tx) => {
      const cap = await tx.capitalContribution.create({
        data: {
          date: data.date,
          contributorId: userId,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          paymentMethod: data.paymentMethod
        },
        include: { contributor: true }
      });

      await syncCapitalTransaction(cap, user.name, tx);
      return cap;
    });

    return formatCapital(capital);
  }

  static async update(id: string, data: any) {
    const existing = await prisma.capitalContribution.findFirst({
      where: { id, deletedAt: null },
      include: { contributor: true }
    });
    if (!existing) {
      throw new NotFoundError('Capital record not found');
    }

    const capital = await prisma.$transaction(async (tx) => {
      const cap = await tx.capitalContribution.update({
        where: { id },
        data: {
          date: data.date,
          description: data.description,
          amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
          paymentMethod: data.paymentMethod
        },
        include: { contributor: true }
      });

      await syncCapitalTransaction(cap, existing.contributor.name, tx);
      return cap;
    });

    return formatCapital(capital);
  }

  static async delete(id: string) {
    const existing = await prisma.capitalContribution.findFirst({
      where: { id, deletedAt: null },
      include: { contributor: true }
    });
    if (!existing) {
      throw new NotFoundError('Capital record not found');
    }

    const capital = await prisma.$transaction(async (tx) => {
      const cap = await tx.capitalContribution.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await syncCapitalTransaction(cap, existing.contributor.name, tx);
      return cap;
    });

    return formatCapital(capital);
  }

  static async list() {
    // SQLite query executing SQL window functions: SUM(amount) OVER (ORDER BY date, createdAt)
    // To return structured data, we run Prisma.$queryRaw
    const rawContributions = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          c.id, 
          c.date, 
          c.description, 
          c.amount, 
          c.paymentMethod, 
          c.contributorId, 
          c.createdAt,
          u.name as contributorName,
          SUM(c.amount) OVER (ORDER BY c.date ASC, c.createdAt ASC) as runningTotal
        FROM CapitalContribution c
        JOIN User u ON c.contributorId = u.id
        WHERE c.deletedAt IS NULL
        ORDER BY c.date DESC, c.createdAt DESC
      `
    );

    // Map Decimal values to standard String format to maintain uniform interface response styles
    return rawContributions.map(row => ({
      id: row.id,
      date: typeof row.date === 'string' ? row.date : new Date(Number(row.date)).toISOString(),
      description: row.description,
      amount: String(row.amount),
      paymentMethod: row.paymentMethod,
      contributorId: row.contributorId,
      contributor: {
        id: row.contributorId,
        name: row.contributorName
      },
      runningTotal: String(row.runningTotal),
      createdAt: typeof row.createdAt === 'string' ? row.createdAt : new Date(Number(row.createdAt)).toISOString()
    }));
  }
}

function formatCapital(cap: any) {
  if (!cap) return cap;
  return {
    ...cap,
    amount: cap.amount.toString()
  };
}
