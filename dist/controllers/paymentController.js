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
exports.createPayment = void 0;
const mercadopago_1 = __importDefault(require("mercadopago"));
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payment_data = {
        transaction_amount: req.body.amount || 100,
        description: req.body.description || "Produto de teste",
        payment_method_id: req.body.payment_method_id || "pix",
        installments: req.body.installments || 1, // Número de parcelas, padrão para 1
        payer: {
            email: req.body.email || "test_user@test.com",
        },
    };
    try {
        const response = yield mercadopago_1.default.payment.create(payment_data);
        console.log("Pagamento criado com sucesso:", response.body);
        res.status(200).json({ message: "Pagamento criado com sucesso", data: response.body });
    }
    catch (error) {
        console.error("Erro ao criar pagamento:", error);
        res.status(500).json({ message: "Erro ao criar pagamento", error });
    }
});
exports.createPayment = createPayment;
