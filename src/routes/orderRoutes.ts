import { Router } from 'express';
import { getAllOrders, getOrderById, createOrder, updateOrderStatus } from '../controllers/orderController';
import authMiddleware from '../middleware/authMiddleware';

const router = Router();

// Rotas de pedidos
router.get('/', authMiddleware, getAllOrders); // Lista todos os pedidos (admin)
router.get('/me', authMiddleware, getAllOrders); // Lista pedidos do usuário autenticado
router.get('/:id', authMiddleware, getOrderById); // Detalhes de um pedido específico
router.post('/', authMiddleware, createOrder); // Criação de um novo pedido
router.patch('/:id', authMiddleware, updateOrderStatus); // Atualiza o status de um pedido
router.put("/update-status/:id", authMiddleware, updateOrderStatus);

export default router;
