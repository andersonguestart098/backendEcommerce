"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const router = (0, express_1.Router)();
router.get('/', orderController_1.getAllOrders); // Rota para listar todos os pedidos
router.get('/:id', orderController_1.getOrderById); // Rota para obter um pedido por ID
router.post('/', orderController_1.createOrder); // Rota para criar um novo pedido
exports.default = router;
