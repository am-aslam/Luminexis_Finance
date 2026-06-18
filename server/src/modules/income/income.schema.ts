import { z } from 'zod';

export const createIncomeSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  totalAmount: z.preprocess((val) => Number(val), z.number().positive('totalAmount must be positive')),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CARD']),
  status: z.enum(['PAID', 'PENDING', 'FAILED', 'COMPLETED']).default('COMPLETED')
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const queryIncomeSchema = z.object({
  category: z.string().optional(),
  dateFrom: z.string().transform((str) => new Date(str)).optional(),
  dateTo: z.string().transform((str) => new Date(str)).optional(),
  status: z.string().optional(),
  page: z.preprocess((val) => Number(val || 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => Number(val || 20), z.number().int().positive().default(20))
});
