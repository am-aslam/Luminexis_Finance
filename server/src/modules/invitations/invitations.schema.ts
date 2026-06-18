import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email('Provide a valid email address'),
  role: z.enum(['CO_FOUNDER', 'ADMIN']).default('CO_FOUNDER')
});
