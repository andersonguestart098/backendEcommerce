import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Retorno como void para compatibilidade com RequestHandler
  console.log("Iniciando criação de pagamento...");
  console.log("Dados recebidos no backend:", req.body);

  const {
    products,
    paymentMethod,
    email,
    firstName,
    lastName,
    shippingCost,
    token,
    transactionAmount,
  } = req.body;

  const transaction_amount = parseFloat(transactionAmount);
  if (isNaN(transaction_amount) || transaction_amount <= 0) {
    console.error("Erro: transactionAmount inválido ou não fornecido.");
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

  const isCreditCard = paymentMethod === "Cartão de Crédito";
  if (!paymentMethod || (typeof paymentMethod !== "string" && !isCreditCard)) {
    console.error("Erro: Método de pagamento inválido ou não fornecido.");
    res.status(400).json({
      error:
        "O campo 'paymentMethod' é obrigatório e deve ser um método de pagamento válido.",
    });
    return;
  }

  const paymentData = {
    transaction_amount,
    token,
    description: "Compra de produtos",
    installments: isCreditCard ? 12 : 1,
    payment_method_id: isCreditCard ? "visa" : paymentMethod,
    payer: {
      email: email || "test_user@test.com",
      first_name: firstName || "Nome",
      last_name: lastName || "Sobrenome",
      identification: {
        type: "CPF",
        number: "12345678909",
      },
    },
    statement_descriptor: "Seu E-commerce",
    notification_url: `${process.env.BACKEND_URL}/webhooks`,
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
