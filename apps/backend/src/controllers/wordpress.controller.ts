import { Request, Response } from 'express';
import { publishArticleById } from '../services/wordpress/publish.service.js';
import { logger } from '../utils/logger.js';

export async function publishArticle(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    const result = await publishArticleById(req.params.id);
    res.json({
      success: true,
      wpPostId: result.wpPostId,
      wpPostUrl: result.wpPostUrl,
    });
  } catch (err) {
    const message = (err as Error).message;
    logger.error('Publish error:', err);

    if (message === 'Article non trouvé') {
      res.status(404).json({ error: message });
    } else if (message.startsWith('Credentials WordPress')) {
      res.status(400).json({ error: message });
    } else if (message.startsWith('Erreur WordPress')) {
      res.status(502).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}
