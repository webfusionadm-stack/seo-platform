import { Router } from 'express';
import { createBulk, listSchedules, updateSchedule, generateNow, generateAll, deleteSchedule, cancelScheduleGeneration } from '../controllers/keyword-schedule.controller.js';
import { validate } from '../middleware/validate.js';
import { createBulkScheduleSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', listSchedules);
router.post('/bulk', validate(createBulkScheduleSchema), createBulk);
router.post('/generate-all', generateAll);
router.post('/:id/generate', generateNow);
router.post('/:id/cancel', cancelScheduleGeneration);
router.patch('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
