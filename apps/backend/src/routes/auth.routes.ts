import { Router } from 'express';
import { login, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '@seo-platform/shared';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, me);

export default router;
