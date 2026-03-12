import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/auth.routes.js';
import sitesRoutes from './routes/sites.routes.js';
import articlesRoutes from './routes/articles.routes.js';
import aiRoutes from './routes/ai.routes.js';
import wordpressRoutes from './routes/wordpress.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import revenueRoutes from './routes/revenue.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import rankRoutes from './routes/rank.routes.js';
import personasRoutes from './routes/personas.routes.js';
import imagesRoutes from './routes/images.routes.js';
import keywordScheduleRoutes from './routes/keyword-schedule.routes.js';
import { startCronJobs } from './services/scheduler/cron.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(import.meta.dirname, '../../uploads')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/sites', authMiddleware, sitesRoutes);
app.use('/api/articles', authMiddleware, articlesRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/articles', authMiddleware, wordpressRoutes);
app.use('/api/orders', authMiddleware, ordersRoutes);
app.use('/api/revenue', authMiddleware, revenueRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/rank', authMiddleware, rankRoutes);
app.use('/api/personas', authMiddleware, personasRoutes);
app.use('/api/images', authMiddleware, imagesRoutes);
app.use('/api/keyword-schedules', authMiddleware, keywordScheduleRoutes);

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
