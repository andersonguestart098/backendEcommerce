import { Request, Response } from "express";
import mercadopago from "mercadopago";

// Configuração do Mercado Pago com o token de sandbox ou produção
const isSandbox = process.env.NODE_ENV !== "production";
mercadopago.configure({
  access_token: isSandbox
    ? process.env.MERCADO_PAGO_SANDBOX_ACCESS_TOKEN || ""
    : process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createPayment = async (req: Request, res: Response) => {
  console.log("Iniciando criação de pagamento...");

  const { products, paymentMethod, email, firstName, lastName, shippingCost } =
    req.body;

  const paymentData = {
    items: products.map((product: any) => ({
      id: product.id,
      title: product.name,
      description: product.description || "Descrição do produto",
      category_id: product.category_id || "outros",
      quantity: product.quantity,
      currency_id: "BRL" as const,
      unit_price: product.price,
    })),
    payer: {
      email: email || "test_user@test.com",
      first_name: firstName || "Nome",
      last_name: lastName || "Sobrenome",
    },
    payment_methods: {
      excluded_payment_types:
        paymentMethod === "PIX"
          ? [{ id: "credit_card" }, { id: "ticket" }]
          : paymentMethod === "Boleto Bancário"
          ? [{ id: "credit_card" }, { id: "pix" }]
          : paymentMethod === "Cartão de Crédito"
          ? [{ id: "pix" }, { id: "ticket" }]
          : [],
      installments: paymentMethod === "Cartão de Crédito" ? 12 : 1,
    },
    back_urls: {
      success: `${process.env.FRONTEND_URL}/sucesso`,
      failure: `${process.env.FRONTEND_URL}/falha`,
      pending: `${process.env.FRONTEND_URL}/pendente`,
    },
    auto_return: "approved" as const,
    external_reference: "ID_DO_PEDIDO_AQUI",
    notification_url: `${process.env.BACKEND_URL}/webhook`,
  };

  try {
    const response = await mercadopago.preferences.create(paymentData);
    res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
