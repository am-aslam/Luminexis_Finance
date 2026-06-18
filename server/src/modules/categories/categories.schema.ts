import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['EXPENSE', 'INCOME'], {
    errorMap: () => ({ message: "Type must be either 'EXPENSE' or 'INCOME'" })
  })
});

export const updateCategorySchema = createCategorySchema.partial();
