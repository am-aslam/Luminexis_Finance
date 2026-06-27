import app from './app.js';
import { env } from './config/env.js';
import { logger } from './middleware/requestLogger.js';
import { prisma } from './config/database.js';

async function startServer() {
  try {
    logger.info('Verifying database connectivity...');
    await prisma.$connect();
    logger.info('Database connection established successfully.');

    app.listen(env.PORT, () => {
      logger.info(`Server started successfully and listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server due to database connectivity issue:', error);
    process.exit(1);
  }
}

startServer();

