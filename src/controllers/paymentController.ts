// controllers/paymentController.ts
import { Request, Response } from "express";
import mercadopago from "mercadopago";

// Configura o Mercado Pago com o access token
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");

export const createPayment = async (req: Request, res: Response) => {
    console.log("Iniciando criação de pagamento..."); // Log inicial
    console.log("Token de acesso:", process.env.MERCADO_PAGO_ACCESS_TOKEN); // Verifica se o token está disponível

    // Dados do pagamento
    const payment_data = {
        items: [
          {
            title: req.body.description || "Produto de exemplo",
            quantity: 1,
            currency_id: "BRL" as const,
            unit_price: req.body.amount || 100,
          },
        ],
        payer: {
          email: req.body.email || "test_user@test.com",
        },
        payment_methods: {
          installments: req.body.installments || 1,
        },
        back_urls: {
          success: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/sucesso",
          failure: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/falha",
          pending: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/pendente",
        },
        auto_return: "approved" as const,
        external_reference: "ID_DO_PEDIDO_AQUI",
    };

    console.log("Dados do pagamento:", payment_data); // Log dos dados de pagamento

    try {
        console.log("Enviando requisição para criar preferência de pagamento...");
        const response = await mercadopago.preferences.create(payment_data);
        console.log("Preferência de pagamento criada com sucesso:", response.body); // Log em caso de sucesso
        res.status(200).json({ init_point: response.body.init_point }); // Link para o Checkout Pro
    } catch (error) {
        console.error("Erro ao criar pagamento:", error); // Log detalhado do erro
        res.status(500).json({ message: "Erro ao criar pagamento", error });
    }
};
