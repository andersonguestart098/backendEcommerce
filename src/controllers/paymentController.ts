import { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Iniciando criação de pagamento...");
  console.log("Dados recebidos:", req.body);

  const {
    transaction_amount,
    payment_method_id,
    installments = 1,
    token,
    items,
    userId,
    device_id = "default_device_id",
  } = req.body;

  // Exige o token apenas para pagamentos com cartão
  const requiresToken = payment_method_id === "credit_card";

  if (
    !transaction_amount ||
    !payment_method_id ||
    (requiresToken && !token) ||
    !userId
  ) {
    console.error("Dados obrigatórios ausentes:", {
      transaction_amount,
      payment_method_id,
      token,
      userId,
    });
    res
      .status(400)
      .json({ error: "Dados obrigatórios ausentes ou incorretos." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    const payer = {
      email: user.email,
      first_name: user.name.split(" ")[0],
      last_name: user.name.split(" ").slice(1).join(" "),
      identification: {
        type: "CPF",
        number: user.cpf || "00000000000",
      },
    };

    const description =
      items && items.length > 0 ? items[0].description : "Compra de produtos";

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: transaction_amount,
        status: "PENDING",
      },
    });

    const paymentData = {
      transaction_amount,
      description,
      payment_method_id,
      ...(requiresToken && { token }), // Inclui o token apenas se necessário
      installments,
      payer,
      metadata: {
        device_id: device_id,
      },
      statement_descriptor: "Seu E-commerce",
      notification_url:
        "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
      external_reference: order.id,
    };

    const response = await mercadopago.payment.create(paymentData);
    console.log("Pagamento criado com sucesso:", response.body);

    if (response.body?.point_of_interaction?.transaction_data?.qr_code_base64) {
      res.status(200).json({
        message: "Pagamento criado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
        point_of_interaction: {
          transaction_data: {
            qr_code_base64:
              response.body.point_of_interaction.transaction_data
                .qr_code_base64,
          },
        },
      });
    } else if (response.body?.transaction_details?.external_resource_url) {
      // Para boleto bancário, envia o URL do boleto
      res.status(200).json({
        message: "Pagamento criado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
        ticket_url: response.body.transaction_details.external_resource_url,
      });
    } else {
      res.status(200).json({
        message:
          "Pagamento criado, mas informações de retorno específicas não foram geradas.",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
      });
    }
  } catch (error: any) {
    console.error("Erro ao criar pagamento:", error.response?.data || error);
    res.status(500).json({
      message: "Erro ao criar pagamento",
      error: error.response?.data,
    });
  }
};
