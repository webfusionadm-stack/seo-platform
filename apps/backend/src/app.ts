import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { runDueSchedules } from './services/scheduler/keyword-scheduler.service.js';
import { runScheduledPublications } from './services/scheduler/cron.js';

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

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Diagnostic endpoint (temporaire)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, node: process.version, env: process.env.NODE_ENV });
});

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

// Vercel cron endpoints
app.get('/api/cron/keyword-schedules', async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    await runDueSchedules();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/cron/publications', async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    await runScheduledPublications();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default app;
