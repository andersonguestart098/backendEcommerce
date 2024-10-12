import { Router } from 'express';
import { getAllOrders, getOrderById, createOrder } from '../controllers/orderController';

const router = Router();

router.get('/', getAllOrders); // Rota para listar todos os pedidos
router.get('/:id', getOrderById); // Rota para obter um pedido por ID
router.post('/', createOrder); // Rota para criar um novo pedido

export default router;
