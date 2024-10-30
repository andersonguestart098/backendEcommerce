import { Request, Response, RequestHandler } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
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

  // Verificação e adaptação dos dados de `payer`
  if (!payer || !payer.email || !payer.cpf || !payer.name || !payer.address) {
    res
      .status(400)
      .json({ error: "Dados de `payer` ausentes ou incompletos." });
    return;
  }

  // Extração de `first_name` e `last_name` a partir do campo `name`
  const [first_name, ...lastNameParts] = payer.name.split(" ");
  const last_name = lastNameParts.join(" ") || "";

  const paymentData = {
    transaction_amount: transactionAmount,
    description: items[0]?.description || "Compra de produtos",
    payment_method_id,
    payer: {
      email: payer.email,
      first_name,
      last_name,
      identification: {
        type: "CPF",
        number: payer.cpf,
      },
      address: {
        street_name: payer.address.street,
        zip_code: payer.address.postalCode,
        city: payer.address.city,
        state: payer.address.state,
        country: payer.address.country,
      },
    },
    metadata: {
      device_id,
    },
    statement_descriptor: "Seu E-commerce",
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
    external_reference: userId,
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
