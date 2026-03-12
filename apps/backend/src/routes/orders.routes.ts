import { Router } from 'express';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../controllers/orders.controller.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderSchema } from '@seo-platform/shared';

const router = Router();

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', validate(createOrderSchema), createOrder);
router.put('/:id', validate(updateOrderSchema), updateOrder);
router.delete('/:id', deleteOrder);

export default router;
