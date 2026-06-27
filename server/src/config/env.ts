import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL:        z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET:   z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:  z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES:  z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  // FRONTEND_URL / CLIENT_URL — supports both names for backwards compat
  CLIENT_URL:          z.string().url().default('http://localhost:5173'),
  FRONTEND_URL:        z.string().url().optional(),
  PORT:                z.preprocess((val) => Number(val), z.number().default(4000)),
  NODE_ENV:            z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL:           z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables — server cannot start:');
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
