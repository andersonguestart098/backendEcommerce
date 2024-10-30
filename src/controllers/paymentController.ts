import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Iniciando criação de pagamento...");
  console.log("Dados recebidos no backend:", req.body);

  const {
    token,
    transaction_amount,
    payment_method_id,
    installments,
    payer,
    items,
    external_reference,
    device_id,
  } = req.body;

  const transactionAmount = parseFloat(transaction_amount);
  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    res.status(400).json({
      error: "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  // Simplifique o processamento de items, utilizando apenas a descrição do primeiro item
  const itemDescription = items?.[0]?.description || "Compra de produtos";

  const paymentData = {
    transaction_amount: transactionAmount,
    token,
    description: itemDescription, // Enviando apenas a descrição do item
    installments: Number(installments),
    payment_method_id,
    payer: {
      email: payer.email,
      first_name: payer.first_name || "",
      last_name: payer.last_name || "",
      identification: payer.identification,
    },
    metadata: {
      device_id: device_id || "default_device_id", // Valor padrão se não fornecido
    },
    statement_descriptor: "Seu E-commerce",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
    external_reference,
  };

  console.log("Dados preparados para envio ao Mercado Pago:", JSON.stringify(paymentData, null, 2));

  try {
    const response = await mercadopago.payment.create(paymentData);
    console.log("Resposta do Mercado Pago:", JSON.stringify(response.body, null, 2));

    if (response.body.status === "approved") {
      res.status(200).json({
        message: "Pagamento aprovado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
      });
    } else {
      res.status(200).json({
        message: "Pagamento pendente ou recusado",
        status: response.body.status,
        status_detail: response.body.status_detail,
      });
    }
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error.response ? error.response.data : error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
