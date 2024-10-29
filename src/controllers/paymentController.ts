import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (req: Request, res: Response) => {
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

  const paymentData = {
    transaction_amount: transactionAmount,
    token,
    description: "Compra de produtos",
    installments: paymentMethod === "Cartão de Crédito" ? 12 : 1,
    payment_method_id:
      paymentMethod === "Cartão de Crédito" ? "visa" : paymentMethod,
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
