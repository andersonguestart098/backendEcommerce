"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMercadoPagoWebhook = void 0;
const client_1 = require("@prisma/client");
const mercadopago_1 = __importDefault(require("mercadopago"));
const prisma = new client_1.PrismaClient();
const handleMercadoPagoWebhook = async (req, res) => {
    const { id, type } = req.query;
    if (type === "payment" && typeof id === "string") {
        try {
            const paymentId = parseInt(id, 10);
            if (isNaN(paymentId)) {
                console.error("ID de pagamento inválido");
                res.sendStatus(400);
                return;
            }
            const payment = await mercadopago_1.default.payment.findById(paymentId);
            const orderId = payment.body.external_reference;
            const status = payment.body.status;
            await prisma.order.update({
                where: { id: orderId },
                data: { status },
            });
            console.log(`Pedido ${orderId} atualizado para status: ${status}`);
            res.sendStatus(200);
        }
        catch (error) {
            console.error("Erro ao processar webhook:", error);
            res.sendStatus(500);
        }
    }
    else {
        res.sendStatus(400);
    }
};
exports.handleMercadoPagoWebhook = handleMercadoPagoWebhook;
