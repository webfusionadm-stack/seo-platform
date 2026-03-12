import { Router } from 'express';
import { generateSeo, generateSponsored } from '../controllers/ai.controller.js';
import { generateSeoPipeline } from '../controllers/seo-pipeline.controller.js';
import { validate } from '../middleware/validate.js';
import { generateSeoSchema, generateSponsoredSchema, generateSeoPipelineSchema } from '@seo-platform/shared';

const router = Router();

router.post('/generate/seo', validate(generateSeoSchema), generateSeo);
router.post('/generate/sponsored', validate(generateSponsoredSchema), generateSponsored);
router.post('/generate/seo-pipeline', validate(generateSeoPipelineSchema), generateSeoPipeline);

export default router;
