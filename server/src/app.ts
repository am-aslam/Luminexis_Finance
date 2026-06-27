import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

// Route Imports
import authRoutes from './modules/auth/auth.routes.js';
import expensesRoutes from './modules/expenses/expenses.routes.js';
import incomeRoutes from './modules/income/income.routes.js';
import capitalRoutes from './modules/capital/capital.routes.js';
import ledgerRoutes from './modules/ledger/ledger.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import vendorsRoutes from './modules/vendors/vendors.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import invitationsRoutes from './modules/invitations/invitations.routes.js';
import { prisma } from './config/database.js';

const app = express();

// Trust Render / Vercel / Cloudflare reverse proxies
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — only allow the configured frontend origin
const allowedOrigins = [
  env.CLIENT_URL,
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not permitted`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Gzip compression
app.use(compression());

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Request Logger
app.use(requestLogger);

// Global Rate Limiter
app.use(rateLimiter);

// ─── Health Check ──────────────────────────────────────────────────────────────
// Used by Render to verify the server is alive after deployment
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

// ─── API v1 Routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/capital', capitalRoutes);
app.use('/api/v1/ledger', ledgerRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/vendors', vendorsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/invitations', invitationsRoutes);

// ─── Developer Debug Reset (disabled in production) ───────────────────────────
app.post('/api/v1/debug/reset', async (req, res, next) => {
  try {
    if (env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Database reset is disabled in production.' }
      });
    }

    await prisma.bankTransaction.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.income.deleteMany();
    await prisma.capitalContribution.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.user.deleteMany();

    return res.status(200).json({
      success: true,
      data: { message: 'Database tables wiped successfully. Ready for clean setup.' }
    });
  } catch (err) {
    next(err);
  }
});

// ─── 404 Fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    }
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
