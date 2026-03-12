import express from 'express';
import path from 'path';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startCronJobs } from './services/scheduler/cron.js';

// Serve uploaded images
app.use('/uploads', express.static(path.join(import.meta.dirname, '../../uploads')));

// Serve frontend SPA in production
if (env.NODE_ENV === 'production') {
  const frontendDist = path.join(import.meta.dirname, '../../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} (with keyword-schedules)`);
  startCronJobs();
});
