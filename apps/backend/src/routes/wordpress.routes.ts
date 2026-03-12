import { Router } from 'express';
import { publishArticle } from '../controllers/wordpress.controller.js';

const router = Router();

router.post('/:id/publish', publishArticle);

export default router;
