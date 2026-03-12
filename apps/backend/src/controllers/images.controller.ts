import { Request, Response, NextFunction } from 'express';
import { searchFreepikImages, downloadFreepikImage } from '../services/image/freepik.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function searchImages(req: Request, res: Response, next: NextFunction) {
  try {
    const keyword = req.query.keyword as string;
    const page = parseInt(req.query.page as string) || 1;
    if (!keyword) {
      return res.status(400).json({ error: 'Le paramètre keyword est requis' });
    }

    const images = await searchFreepikImages(keyword, 6, page);
    res.json({ images });
  } catch (err) {
    next(err);
  }
}

export async function selectImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId, freepikResourceId } = req.body as { articleId: string; freepikResourceId: number };

    if (!articleId || !freepikResourceId) {
      return res.status(400).json({ error: 'articleId et freepikResourceId sont requis' });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }

    const result = await downloadFreepikImage(freepikResourceId, articleId);

    if (!result) {
      return res.status(500).json({ error: 'Impossible de télécharger l\'image' });
    }

    // Update article with the image URL
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { featuredImageUrl: result.url },
      include: { scheduledKeyword: true, site: true },
    });

    logger.info(`Image sélectionnée pour l'article ${articleId}: ${result.url}`);

    // If article is in REVIEW and linked to a keyword schedule, set as SCHEDULED
    if (
      updatedArticle.status === 'REVIEW' &&
      updatedArticle.scheduledKeyword &&
      updatedArticle.site.wpUrl &&
      updatedArticle.site.wpUsername &&
      updatedArticle.site.wpAppPasswordEnc
    ) {
      const scheduledPublishAt = new Date(Date.now() + 30 * 60 * 1000); // 30min dans le futur
      await prisma.article.update({
        where: { id: articleId },
        data: { status: 'SCHEDULED', scheduledPublishAt },
      });
      logger.info(`Article ${articleId} planifié pour publication le ${scheduledPublishAt.toISOString()}`);
      res.json({ featuredImageUrl: result.url, status: 'SCHEDULED', scheduledPublishAt: scheduledPublishAt.toISOString() });
      return;
    }

    res.json({ featuredImageUrl: result.url });
  } catch (err) {
    logger.error('Erreur sélection image:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Erreur lors du téléchargement' });
  }
}
