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

  console.log("Dados recebidos no request:", {
    transaction_amount,
    payment_method_id,
    payer,
    items,
    device_id,
    userId,
  });

  const transactionAmount = parseFloat(transaction_amount);

  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    console.error("Erro: `transaction_amount` é inválido:", transaction_amount);
    res.status(400).json({
      error:
        "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  if (!payer || !payer.email || !payer.identification) {
    console.error("Erro: Dados de `payer` ausentes ou incompletos:", payer);
    res.status(400).json({
      error:
        "Os dados de 'payer' estão incompletos. Verifique se 'email' e 'identification' estão presentes.",
    });
    return;
  }

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

  console.log("Dados prontos para envio ao Mercado Pago:", paymentData);

  try {
    const response = await mercadopago.payment.create(paymentData);
    console.log("Resposta do Mercado Pago:", response.body);
    res.status(200).json({
      message: "Pagamento criado",
      status: response.body.status,
      status_detail: response.body.status_detail,
      id: response.body.id,
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error.response?.data || error);
    res.status(500).json({
      message: "Erro ao criar pagamento",
      error: error.response?.data,
    });
  }
};
