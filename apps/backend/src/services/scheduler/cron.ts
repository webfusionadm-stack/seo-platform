import cron from 'node-cron';
import { logger } from '../../utils/logger.js';
import { runDueSchedules } from './keyword-scheduler.service.js';
import { prisma } from '../../config/database.js';
import { publishArticleById } from '../wordpress/publish.service.js';

const MAX_PUBLISH_RETRIES = 5;

export async function runScheduledPublications(): Promise<void> {
  const articles = await prisma.article.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledPublishAt: { lte: new Date() },
      publishRetryCount: { lt: MAX_PUBLISH_RETRIES },
      wpPostId: null, // Ne pas re-publier les articles déjà poussés sur WP
    },
    orderBy: { scheduledPublishAt: 'asc' },
  });

  for (const article of articles) {
    try {
      const result = await publishArticleById(article.id);
      await prisma.article.update({
        where: { id: article.id },
        data: {
          publishError: null,
          lastPublishAt: new Date(),
        },
      });
      logger.info(`Publication planifiée réussie: "${article.title}" (wpPostId: ${result.wpPostId})`);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Erreur inconnue';
      const newRetryCount = article.publishRetryCount + 1;

      if (newRetryCount >= MAX_PUBLISH_RETRIES) {
        // Max retries reached — mark as PUBLISH_FAILED
        await prisma.article.update({
          where: { id: article.id },
          data: {
            status: 'PUBLISH_FAILED',
            publishError: errorMessage,
            publishRetryCount: newRetryCount,
            lastPublishAt: new Date(),
          },
        });
        logger.error(`Publication définitivement échouée pour "${article.title}" après ${newRetryCount} tentatives: ${errorMessage}`);
      } else {
        // Backoff exponentiel: 2^retryCount minutes
        const backoffMinutes = Math.pow(2, newRetryCount);
        const nextAttempt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        await prisma.article.update({
          where: { id: article.id },
          data: {
            publishError: errorMessage,
            publishRetryCount: newRetryCount,
            lastPublishAt: new Date(),
            scheduledPublishAt: nextAttempt,
          },
        });
        logger.warn(`Publication échouée pour "${article.title}" (tentative ${newRetryCount}/${MAX_PUBLISH_RETRIES}), prochaine tentative dans ${backoffMinutes}min: ${errorMessage}`);
      }
    }
  }
}

export function startCronJobs(): void {
  // Run every minute to check for due keyword schedules
  cron.schedule('* * * * *', async () => {
    try {
      await runDueSchedules();
    } catch (err) {
      logger.error('Cron job error (keyword scheduler):', err);
    }
  });

  // Run every minute to check for scheduled publications
  cron.schedule('* * * * *', async () => {
    try {
      await runScheduledPublications();
    } catch (err) {
      logger.error('Cron job error (scheduled publications):', err);
    }
  });

  logger.info('Cron jobs démarrés (keyword scheduler + publications planifiées: toutes les minutes)');
}
