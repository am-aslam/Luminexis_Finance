import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use(requestLogger);

// Global Rate Limiter
app.use(rateLimiter);

// API v1 Routes
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

// Developer debug endpoint to reset database tables
app.post('/api/v1/debug/reset', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
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

// Fallback for unhandled routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
