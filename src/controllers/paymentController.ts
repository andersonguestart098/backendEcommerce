// controllers/paymentController.ts
import { Request, Response } from "express";
import mercadopago from "mercadopago";

// Configure o Mercado Pago com o access token
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");

export const createPayment = async (req: Request, res: Response) => {
  const payment_data = {
    items: [
      {
        title: req.body.description || "Produto de exemplo",
        quantity: 1,
        currency_id: "BRL" as const, // Adicionando "as const" para especificar o tipo
        unit_price: req.body.amount || 100,
      },
    ],
    payer: {
      email: req.body.email || "test_user@test.com",
    },
    payment_methods: {
      installments: req.body.installments || 1, // Número de parcelas
    },
    back_urls: {
      success: "https://seu-site.com/sucesso",
      failure: "https://seu-site.com/falha",
      pending: "https://seu-site.com/pending",
    },
    auto_return: "approved" as const, // Certificando o valor como compatível
    external_reference: "ID_DO_PEDIDO_AQUI",
  };

  try {
    const response = await mercadopago.preferences.create(payment_data);
    console.log("Preferência de pagamento criada com sucesso:", response.body);
    res.status(200).json({ init_point: response.body.init_point }); // Link para o Checkout Pro
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
