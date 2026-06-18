import { z } from 'zod';

export const createExpenseSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  category: z.string().min(1, 'Category is required'),
  vendorId: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  baseAmount: z.preprocess((val) => Number(val), z.number().nonnegative('baseAmount must be non-negative')),
  gstPercent: z.preprocess((val) => Number(val), z.number().min(0).max(100).default(0)),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CARD']),
  status: z.enum(['PAID', 'PENDING', 'FAILED', 'COMPLETED']).default('PAID'),
  notes: z.string().optional().nullable()
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const queryExpensesSchema = z.object({
  category: z.string().optional(),
  dateFrom: z.string().transform((str) => new Date(str)).optional(),
  dateTo: z.string().transform((str) => new Date(str)).optional(),
  paidBy: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  page: z.preprocess((val) => Number(val || 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => Number(val || 20), z.number().int().positive().default(20)),
  sortBy: z.enum(['date', 'totalAmount', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
