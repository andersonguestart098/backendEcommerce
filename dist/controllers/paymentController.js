"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = void 0;
const mercadopago_1 = __importDefault(require("mercadopago"));
// Configure Mercado Pago with the access token
mercadopago_1.default.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
});
const createPayment = async (req, res) => {
    console.log("Iniciando criação de pagamento...");
    // Define payment data with specific type matches for Mercado Pago requirements
    const paymentData = {
        items: [
            {
                title: req.body.description || "Produto de exemplo",
                quantity: 1,
                currency_id: "BRL", // Type set to a constant for exact match
                unit_price: parseFloat(req.body.amount) || 100,
            },
        ],
        payer: {
            email: req.body.email || "test_user@test.com",
        },
        payment_methods: {
            installments: parseInt(req.body.installments, 10) || 1,
        },
        back_urls: {
            success: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/sucesso",
            failure: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/falha",
            pending: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/pendente",
        },
        auto_return: "approved", // Type explicitly narrowed for compatibility
        external_reference: "ID_DO_PEDIDO_AQUI",
    };
    try {
        const response = await mercadopago_1.default.preferences.create(paymentData);
        res.status(200).json({ init_point: response.body.init_point });
    }
    catch (error) {
        console.error("Erro ao criar pagamento:", error);
        res.status(500).json({ message: "Erro ao criar pagamento", error });
    }
};
exports.createPayment = createPayment;
