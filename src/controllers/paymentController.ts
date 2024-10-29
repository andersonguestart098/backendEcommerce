import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (req: Request, res: Response) => {
  console.log("Iniciando criação de pagamento...");

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
    notification_url: `${process.env.BACKEND_URL}/webhook`,
    additional_info: {
      items: products.map((product: any) => ({
        id: product.id,
        title: product.name,
        description: product.description || "Descrição do produto",
        category_id: product.category_id || "outros",
        quantity: product.quantity,
        unit_price: product.price,
      })),
      payer: {
        first_name: firstName,
        last_name: lastName,
        address: {
          zip_code: "12345-678",
          street_name: "Rua Exemplo",
          street_number: 123,
        },
      },
      shipments: {
        receiver_address: "Rua Exemplo, 123, 1º andar, apt 101, 12345-678",
      },
    },
  };

  try {
    const response = await mercadopago.payment.create(paymentData);
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
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
