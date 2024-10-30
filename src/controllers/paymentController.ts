import { Request, Response, RequestHandler } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment: RequestHandler = async (
  req: Request,
  res: Response
) => {
  console.log("Iniciando criação de pagamento...");
  const {
    token,
    transaction_amount,
    payment_method_id,
    installments,
    payer,
    items,
    device_id,
    userId,
  } = req.body;

  const transactionAmount = parseFloat(transaction_amount);
  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    res.status(400).json({
      error:
        "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  // Configuração dos dados do pagamento
  const paymentData: any = {
    transaction_amount: transactionAmount,
    description: items[0]?.description || "Compra de produtos",
    payment_method_id,
    payer: {
      email: payer.email,
      first_name: payer.first_name || "",
      last_name: payer.last_name || "",
      identification: payer.identification,
    },
    metadata: {
      device_id: device_id || "default_device_id",
    },
    statement_descriptor: "Seu E-commerce",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
    external_reference: userId,
  };

  // Adiciona installments somente para pagamentos com cartão
  if (payment_method_id === "card" && installments) {
    paymentData.installments = installments;
    paymentData.token = token; // Inclui o token apenas para cartões
  }

  try {
    const response = await mercadopago.payment.create(paymentData);
    res.status(200).json({
      message: "Pagamento criado",
      status: response.body.status,
      status_detail: response.body.status_detail,
      id: response.body.id,
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error.response?.data || error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
