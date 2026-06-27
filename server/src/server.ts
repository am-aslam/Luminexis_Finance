import app from './app.js';
import { env } from './config/env.js';
import { logger } from './middleware/requestLogger.js';
import { prisma } from './config/database.js';

async function startServer() {
  try {
    logger.info('Verifying database connectivity...');
    await prisma.$connect();
    logger.info('✅ Database connection established successfully.');

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server started on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // ─── Graceful Shutdown ───────────────────────────────────────────────────
    // Render (and other platforms) send SIGTERM before stopping the container.
    // We close the HTTP server first, then disconnect Prisma.
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed. Goodbye.');
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled promise rejection');
    });

    // Catch uncaught synchronous exceptions
    process.on('uncaughtException', (err) => {
      logger.error({ err }, 'Uncaught exception — shutting down');
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server — database connection failed:');
    logger.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
