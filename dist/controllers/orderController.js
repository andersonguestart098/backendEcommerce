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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.createOrder = exports.getOrderById = void 0;
const client_1 = require("@prisma/client");
const __1 = require("..");
const mercadopago_1 = __importDefault(require("mercadopago"));
const prisma = new client_1.PrismaClient();
// Fetch a specific order by ID
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const authReq = req;
    const userId = authReq.user.id;
    const userRole = authReq.user.tipoUsuario;
    try {
        const order = yield prisma.order.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!order || (order.userId !== userId && userRole !== "admin")) {
            res.status(403).json({ message: "Access Denied" });
            return;
        }
        // Remove invalid entries
        const refinedOrder = Object.assign(Object.assign({}, order), { products: order.products.filter(orderProduct => orderProduct.product !== null) });
        res.json(refinedOrder);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching order" });
    }
});
exports.getOrderById = getOrderById;
// Função para criar pedido e configurar a preferência de pagamento
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authReq = req;
    const { products, totalPrice, shippingCost } = req.body;
    const userId = authReq.user.id;
    try {
        // Criação do pedido no banco de dados
        const order = yield prisma.order.create({
            data: {
                userId,
                totalPrice,
                shippingCost,
                products: {
                    create: products.map((product) => ({
                        productId: product.id,
                        quantity: product.quantity,
                    })),
                },
            },
            include: {
                products: { include: { product: true } },
            },
        });
        // Configuração da preferência de pagamento para o Mercado Pago
        const preference = {
            items: products.map((product) => ({
                title: product.name,
                quantity: product.quantity,
                unit_price: product.price,
            })),
            back_urls: {
                success: "https://seu-front-end.com/order-confirmation",
                failure: "https://seu-front-end.com/order-failure",
                pending: "https://seu-front-end.com/order-pending",
            },
            auto_return: "approved", // Certificando o valor como compatível
            statement_descriptor: "Seu E-commerce",
            external_reference: order.id.toString(),
        };
        // Criação da preferência de pagamento no Mercado Pago
        const mercadoPagoResponse = yield mercadopago_1.default.preferences.create(preference);
        res.status(201).json({
            order,
            init_point: mercadoPagoResponse.body.init_point, // URL de checkout do Mercado Pago
        });
    }
    catch (err) {
        console.error("Erro ao criar pedido ou preferência de pagamento:", err);
        res.status(500).json({ message: "Erro ao criar pedido ou preferência de pagamento" });
    }
});
exports.createOrder = createOrder;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status } = req.body;
    const authReq = req;
    const userRole = authReq.user.tipoUsuario;
    const validStatuses = [
        "PENDING",
        "PAYMENT_APPROVED",
        "AWAITING_STOCK_CONFIRMATION",
        "SEPARATED",
        "DISPATCHED",
        "DELIVERED",
        "CANCELED",
    ];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
    }
    if (userRole !== "admin") {
        res.status(403).json({ message: "Access denied: only admins can change order status" });
        return;
    }
    try {
        const order = yield prisma.order.update({
            where: { id },
            data: { status },
        });
        // Emit the update event
        (0, __1.emitOrderStatusUpdate)(order.id, status, order.userId); // Ensure emit function has access to WebSocket logic
        res.json({ message: "Status updated successfully", order });
    }
    catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Error updating order status" });
    }
});
exports.updateOrderStatus = updateOrderStatus;
