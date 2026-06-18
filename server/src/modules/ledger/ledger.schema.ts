import { z } from 'zod';

export const createBankTransactionSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  type: z.string().optional().default('MANUAL'),
  description: z.string().min(1, 'Description is required'),
  debit: z.preprocess((val) => Number(val ?? 0), z.number().nonnegative('Debit must be non-negative')),
  credit: z.preprocess((val) => Number(val ?? 0), z.number().nonnegative('Credit must be non-negative'))
});

export const updateBankTransactionSchema = createBankTransactionSchema.partial();
