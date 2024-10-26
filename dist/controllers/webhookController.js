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
exports.handleMercadoPagoWebhook = void 0;
const client_1 = require("@prisma/client");
const mercadopago_1 = __importDefault(require("mercadopago"));
const prisma = new client_1.PrismaClient();
const handleMercadoPagoWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, type } = req.query;
    if (type === "payment" && typeof id === "string") {
        try {
            const paymentId = parseInt(id, 10);
            if (isNaN(paymentId)) {
                console.error("ID de pagamento inválido");
                res.sendStatus(400);
                return;
            }
            const payment = yield mercadopago_1.default.payment.findById(paymentId);
            const orderId = payment.body.external_reference;
            const status = payment.body.status;
            yield prisma.order.update({
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
});
exports.handleMercadoPagoWebhook = handleMercadoPagoWebhook;
