"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = exports.getOrderById = exports.getAllOrders = void 0;
const client_1 = require("@prisma/client"); // Usando o Prisma para a conexão com MongoDB
const prisma = new client_1.PrismaClient();
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield prisma.order.findMany({
            include: { products: true }, // Inclui os produtos relacionados no pedido
        });
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
});
exports.getAllOrders = getAllOrders;
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const order = yield prisma.order.findUnique({
            where: { id },
            include: { products: true }, // Inclui os produtos relacionados no pedido
        });
        if (!order) {
            res.status(404).json({ message: 'Pedido não encontrado' });
        }
        else {
            res.json(order);
        }
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pedido' });
    }
});
exports.getOrderById = getOrderById;
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { products, totalPrice } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Captura o ID do usuário autenticado
    try {
        const order = yield prisma.order.create({
            data: {
                userId, // Relaciona o pedido ao usuário autenticado
                totalPrice, // Valor total do pedido
                products: {
                    create: products.map((product) => ({
                        productId: product.id,
                        quantity: product.quantity,
                    })),
                },
            },
            include: { products: true },
        });
        res.status(201).json(order);
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao criar pedido' });
    }
});
exports.createOrder = createOrder;
