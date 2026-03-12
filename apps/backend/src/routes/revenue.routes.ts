import { Router } from 'express';
import { getRevenues, createRevenue, getRevenueStats } from '../controllers/revenue.controller.js';
import { validate } from '../middleware/validate.js';
import { createRevenueSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', getRevenues);
router.post('/', validate(createRevenueSchema), createRevenue);
router.get('/stats', getRevenueStats);

export default router;
