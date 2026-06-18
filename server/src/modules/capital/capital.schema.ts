import { z } from 'zod';

export const createCapitalSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  description: z.string().min(1, 'Description is required'),
  amount: z.preprocess((val) => Number(val), z.number().positive('amount must be positive')),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CARD'])
});

export const updateCapitalSchema = createCapitalSchema.partial();
