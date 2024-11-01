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

  // Verificação básica de valores obrigatórios
  if (!transaction_amount || !payment_method_id || !userId) {
    res.status(400).json({
      error: "transaction_amount, payment_method_id e userId são obrigatórios.",
    });
    return;
  }

  try {
    // Busca o usuário no banco de dados
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
        number: user.cpf || "00000000000", // Usa um valor padrão se o CPF for opcional e não estiver preenchido
      },
    };

    const description =
      items && items.length > 0 ? items[0].description : "Compra de produtos";

    // Cria o pedido no banco de dados e recupera o ID do pedido
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: transaction_amount,
        status: "PENDING",
      },
    });

    // Configura o pagamento conforme o método selecionado
    let paymentData: any = {
      transaction_amount,
      description,
      payment_method_id,
      payer,
      metadata: {
        device_id: device_id,
      },
      statement_descriptor: "Seu E-commerce",
      notification_url:
        "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
      external_reference: order.id,
    };

    // Condições específicas para cada método de pagamento
    if (payment_method_id === "credit_card") {
      if (!token) {
        res
          .status(400)
          .json({ error: "Token é obrigatório para pagamento com cartão." });
        return;
      }
      paymentData = { ...paymentData, token, installments };
    } else if (payment_method_id === "bolbradesco") {
      console.log("Configuração do pagamento via boleto bancário.");
      // Não é necessário token para boleto, então não adicionamos nada extra
    } else if (payment_method_id === "pix") {
      console.log("Configuração do pagamento via Pix.");
    }

    // Criação do pagamento no Mercado Pago
    const response = await mercadopago.payment.create(paymentData);
    console.log("Pagamento criado com sucesso:", response.body);

    // Manipula a resposta com base no método de pagamento
    if (
      payment_method_id === "bolbradesco" &&
      response.body.transaction_details?.external_resource_url
    ) {
      res.status(200).json({
        message: "Pagamento via boleto criado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
        boleto_url: response.body.transaction_details.external_resource_url,
      });
    } else if (
      payment_method_id === "pix" &&
      response.body?.point_of_interaction?.transaction_data?.qr_code_base64
    ) {
      res.status(200).json({
        message: "Pagamento via Pix criado",
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
    } else {
      res.status(200).json({
        message: "Pagamento criado",
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
