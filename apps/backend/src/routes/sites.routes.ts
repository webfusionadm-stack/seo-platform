import { Router } from 'express';
import { getSites, getSite, createSite, updateSite, deleteSite, testConnection } from '../controllers/sites.controller.js';
import { validate } from '../middleware/validate.js';
import { createSiteSchema, updateSiteSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', getSites);
router.get('/:id', getSite);
router.post('/', validate(createSiteSchema), createSite);
router.put('/:id', validate(updateSiteSchema), updateSite);
router.delete('/:id', deleteSite);
router.post('/:id/test-connection', testConnection);

export default router;
