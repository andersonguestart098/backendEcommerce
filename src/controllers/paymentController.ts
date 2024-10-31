import { Request, Response } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { transaction_amount, payment_method_id, payer, description } =
    req.body;

  // Confere se os parâmetros obrigatórios estão presentes
  if (!transaction_amount || !payment_method_id || !payer || !payer.email) {
    console.error("Dados obrigatórios ausentes:", {
      transaction_amount,
      payment_method_id,
      payer,
    });
    res
      .status(400)
      .json({ error: "Dados obrigatórios ausentes ou incorretos." });
    return;
  }

  const paymentData: any = {
    transaction_amount,
    payment_method_id,
    description,
    payer: {
      email: payer.email,
      first_name: payer.first_name || "Nome",
      last_name: payer.last_name || "Sobrenome",
      identification: payer.identification || {
        type: "CPF",
        number: "12345678909",
      },
    },
    notification_url:
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
  };

  try {
    const response = await mercadopago.payment.create(paymentData);
    if (payment_method_id === "pix") {
      const qrCode =
        response.body.point_of_interaction.transaction_data.qr_code;
      const qrCodeUrl =
        response.body.point_of_interaction.transaction_data.qr_code_url;
      res.status(200).json({
        message: "Pix gerado",
        qr_code: qrCode,
        qr_code_url: qrCodeUrl,
      });
    } else {
      res.status(200).json({ message: "Pagamento criado", ...response.body });
    }
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error.response?.data || error);
    res.status(500).json({
      message: "Erro ao criar pagamento",
      error: error.response?.data,
    });
  }
};
