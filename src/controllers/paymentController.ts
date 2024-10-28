import { Request, Response } from "express";
import mercadopago from "mercadopago";

// Configuração do Mercado Pago com o token de acesso
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createPayment = async (req: Request, res: Response) => {
  console.log("Iniciando criação de pagamento...");

  const { products, paymentMethod, email, firstName, lastName, shippingCost } =
    req.body;

  const paymentData = {
    items: products.map((product: any) => ({
      id: product.id, // Código único do item
      title: product.name,
      description: product.description || "Descrição do produto",
      category_id: product.category_id || "outros", // Categoria do item
      quantity: product.quantity,
      currency_id: "BRL" as const,
      unit_price: product.price,
    })),
    payer: {
      email: email || "test_user@test.com",
      first_name: firstName || "Nome", // Nome do comprador
      last_name: lastName || "Sobrenome", // Sobrenome do comprador
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
      success:
        "https://ecommerce-bl0486y1f-andersonguestart098s-projects.vercel.app/sucesso",
      failure:
        "https://ecommerce-bl0486y1f-andersonguestart098s-projects.vercel.app/falha",
      pending:
        "https://ecommerce-bl0486y1f-andersonguestart098s-projects.vercel.app/pendente",
    },
    auto_return: "approved" as const,
    external_reference: "ID_DO_PEDIDO_AQUI",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhook", // URL para receber notificações Webhook
  };

  try {
    const response = await mercadopago.preferences.create(paymentData);
    res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
