import { Router } from 'express';
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle, deleteAllArticles, retryPublishArticle } from '../controllers/articles.controller.js';
import { validate } from '../middleware/validate.js';
import { createArticleSchema, updateArticleSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', getArticles);
router.get('/:id', getArticle);
router.post('/', validate(createArticleSchema), createArticle);
router.put('/:id', validate(updateArticleSchema), updateArticle);
router.post('/:id/retry-publish', retryPublishArticle);
router.delete('/all', deleteAllArticles);
router.delete('/:id', deleteArticle);

export default router;
