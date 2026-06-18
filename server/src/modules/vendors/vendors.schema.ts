import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const updateVendorSchema = createVendorSchema.partial();
