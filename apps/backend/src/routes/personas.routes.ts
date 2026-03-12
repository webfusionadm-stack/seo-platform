import { Router } from 'express';
import { getPersonas, getPersona, createPersona, updatePersona, deletePersona, regeneratePersona, analyzePersonaSample } from '../controllers/personas.controller.js';
import { validate } from '../middleware/validate.js';
import { createPersonaSchema, updatePersonaSchema, analyzePersonaSampleSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', getPersonas);
router.get('/:id', getPersona);
router.post('/analyze-sample', validate(analyzePersonaSampleSchema), analyzePersonaSample);
router.post('/', validate(createPersonaSchema), createPersona);
router.put('/:id', validate(updatePersonaSchema), updatePersona);
router.post('/:id/regenerate', regeneratePersona);
router.delete('/:id', deletePersona);

export default router;
