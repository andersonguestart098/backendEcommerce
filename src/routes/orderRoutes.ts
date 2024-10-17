import { Router } from 'express';
import { getAllOrders, getOrderById, createOrder } from '../controllers/orderController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderById);
router.post('/', authMiddleware, createOrder);

export default router;
