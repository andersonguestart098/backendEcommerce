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
    console.error("Erro: transaction_amount inválido ou não fornecido.");
    res.status(400).json({
      error:
        "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  if (!token || typeof token !== "string") {
    console.error("Erro: token do cartão não foi fornecido ou é inválido.");
    res.status(400).json({
      error: "O campo 'token' é obrigatório e deve ser uma string válida.",
    });
    return;
  }

  if (!payment_method_id || typeof payment_method_id !== "string") {
    console.error("Erro: Método de pagamento inválido ou não fornecido.");
    res.status(400).json({
      error:
        "O campo 'payment_method_id' é obrigatório e deve ser uma string válida.",
    });
    return;
  }

  const installmentCount = Number(installments);
  if (isNaN(installmentCount) || installmentCount <= 0) {
    console.error("Erro: installments inválido ou não fornecido.");
    res.status(400).json({
      error:
        "O campo 'installments' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  if (!payer || !payer.email || typeof payer.email !== "string") {
    console.error("Erro: email do comprador não foi fornecido ou é inválido.");
    res.status(400).json({
      error:
        "O campo 'payer.email' é obrigatório e deve ser uma string válida.",
    });
    return;
  }

  // Estrutura do objeto de pagamento para a API do Mercado Pago
  const paymentData = {
    transaction_amount: transactionAmount,
    token,
    description: "Compra de produtos",
    installments: installmentCount,
    payment_method_id,
    payer: {
      email: payer.email,
      first_name: payer.first_name || "", // Nome do comprador
      last_name: payer.last_name || "", // Sobrenome do comprador
      identification: payer.identification,
    },
    items: items.map((item: any) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      description: item.description,
      category_id: item.category_id || "default",
    })),
    metadata: {
      device_id: device_id, // Inserindo o device_id em metadata, conforme necessário
    },
    statement_descriptor: "Seu E-commerce",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
    external_reference,
  };

  try {
    const response = await mercadopago.payment.create(paymentData);
    console.log("Resposta do Mercado Pago:", response.body);

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
    console.error(
      "Erro ao criar pagamento:",
      error.response ? error.response.data : error
    );
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
