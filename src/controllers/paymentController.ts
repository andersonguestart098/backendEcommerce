import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Iniciando criação de pagamento...");

  const {
    transaction_amount,
    payment_method_id,
    payer,
    items,
    userId,
    device_id = "default_device_id",
  } = req.body;

  const transactionAmount = parseFloat(transaction_amount);
  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    res.status(400).json({
      error:
        "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  // Verifique os dados do pagador para garantir que todos os campos obrigatórios estão presentes
  if (!payer || !payer.email || !payer.first_name || !payer.identification) {
    res
      .status(400)
      .json({ error: "Dados de `payer` ausentes ou incompletos." });
    return;
  }

  const paymentData = {
    transaction_amount: transactionAmount,
    description: items[0]?.description || "Compra de produtos",
    payment_method_id,
    payer: {
      email: payer.email,
      first_name: payer.first_name,
      last_name: payer.last_name || "",
      identification: payer.identification,
    },
    metadata: {
      device_id: device_id,
    },
    statement_descriptor: "Seu E-commerce",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
    external_reference: userId, // Referência ao usuário ou ao pedido
  };

  try {
    const response = await mercadopago.payment.create(paymentData);
    console.log("Pagamento criado com sucesso:", response.body);
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
