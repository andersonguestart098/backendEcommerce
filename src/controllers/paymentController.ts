import { Request, Response, RequestHandler } from "express";
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

// Define a função como um RequestHandler do Express
export const createTransparentPayment: RequestHandler = async (
  req: Request,
  res: Response
) => {
  console.log("Iniciando criação de pagamento...");
  console.log("Dados recebidos no backend:", req.body);

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

  console.log("ID do usuário recebido:", userId);
  items.forEach((item: any) => {
    console.log(`Produto: ${item.productId}, Quantidade: ${item.quantity}`);
  });

  // Log detalhado para verificar os valores dos itens
  items.forEach((item: any, index: number) => {
    console.log(
      `Item ${index} - productId: ${item.productId}, quantity: ${item.quantity}`
    );
  });

  // Verificação adicional para garantir que todos os `productId` e `quantity` estão definidos
  if (!items || !items.every((item: any) => item.productId && item.quantity)) {
    console.error(
      "Erro: Um ou mais itens têm `productId` ou `quantity` inválidos."
    );
    await res.status(400).json({
      error: "Cada item deve conter 'productId' e 'quantity' válidos.",
    });
    return;
  }

  const transactionAmount = parseFloat(transaction_amount);
  if (isNaN(transactionAmount) || transactionAmount <= 0) {
    await res.status(400).json({
      error:
        "O campo 'transaction_amount' é obrigatório e deve ser um número válido.",
    });
    return;
  }

  try {
    // Dados de pagamento para o Mercado Pago
    const paymentData = {
      transaction_amount: transactionAmount,
      token,
      description: items[0]?.description || "Compra de produtos",
      installments: Number(installments),
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

    console.log(
      "Dados preparados para envio ao Mercado Pago:",
      JSON.stringify(paymentData, null, 2)
    );

    const response = await mercadopago.payment.create(paymentData);
    console.log(
      "Resposta do Mercado Pago:",
      JSON.stringify(response.body, null, 2)
    );

    if (response.body.status === "approved") {
      await res.status(200).json({
        message: "Pagamento aprovado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
      });
    } else {
      await res.status(200).json({
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
    await res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
