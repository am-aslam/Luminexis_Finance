import app from './app.js';
import { env } from './config/env.js';
import { logger } from './middleware/requestLogger.js';

app.listen(env.PORT, () => {
  logger.info(`Server started successfully and listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
