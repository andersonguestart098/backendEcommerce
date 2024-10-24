"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const router = (0, express_1.Router)();
// Rotas de pedidos
router.get('/', authMiddleware_1.default, orderController_1.getAllOrders); // Lista todos os pedidos (admin)
router.get('/me', authMiddleware_1.default, orderController_1.getAllOrders); // Lista pedidos do usuário autenticado
router.get('/:id', authMiddleware_1.default, orderController_1.getOrderById); // Detalhes de um pedido específico
router.post('/', authMiddleware_1.default, orderController_1.createOrder); // Criação de um novo pedido
router.patch('/:id', authMiddleware_1.default, orderController_1.updateOrderStatus); // Atualiza o status de um pedido
router.put("/update-status/:id", authMiddleware_1.default, orderController_1.updateOrderStatus);
exports.default = router;
