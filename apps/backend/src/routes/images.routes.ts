import { Router } from 'express';
import { searchImages, selectImage } from '../controllers/images.controller.js';

const router = Router();

router.get('/search', searchImages);
router.post('/select', selectImage);

export default router;
