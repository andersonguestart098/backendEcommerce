import { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const mercadopago = require("mercadopago");

dotenv.config();
const prisma = new PrismaClient();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Iniciando criação de pagamento...");

  // Log dos dados recebidos no backend
  console.log("Dados recebidos no backend:", req.body);

  const {
    transaction_amount,
    payment_method_id,
    installments = 1,
    token,
    products, // produtos recebidos do frontend
    userId,
    device_id = "default_device_id",
  } = req.body;

  // Validação dos dados recebidos
  if (
    !transaction_amount ||
    transaction_amount <= 0.5 ||
    !payment_method_id ||
    (payment_method_id === "credit_card" && !token) ||
    !userId
  ) {
    console.error("Dados obrigatórios ausentes ou incorretos:", {
      transaction_amount,
      payment_method_id,
      token,
      userId,
    });
    res.status(400).json({ error: "Dados obrigatórios ausentes ou incorretos." });
    return;
  }

  console.log("Token capturado no backend:", token);

  try {
    // Validação dos produtos
    if (
      !products ||
      products.some((product: any) => !product.productId || !product.unit_price || !product.quantity)
    ) {
      console.error("Produtos inválidos recebidos:", products);
      res.status(400).json({
        error: "Produtos inválidos. Verifique productId, unit_price e quantity.",
      });
      return;
    }

    console.log("Produtos validados:", products);

    // Busca o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    console.log("Usuário encontrado:", user);

    const payer = {
      email: user.email,
      first_name: user.name.split(" ")[0] || "Nome",
      last_name: user.name.split(" ").slice(1).join(" ") || "Sobrenome",
      identification: {
        type: "CPF",
        number: user.cpf || "00000000000",
      },
    };

    console.log("Dados do pagador (payer):", payer);

    // Cria a ordem no banco de dados
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: transaction_amount,
        status: "PENDING",
        products: {
          create: products.map((product: any) => ({
            productId: product.productId,
            quantity: product.quantity,
            unitPrice: product.unit_price,
          })),
        },
      },
      include: {
        products: { include: { product: true } },
      },
    });

    console.log("Pedido criado com sucesso no banco:", order);

    const description =
      products && products.length > 0
        ? products.map((p: any) => p.description || p.productId).join(", ")
        : "Compra de produtos";

    // Dados do pagamento com `order.id` em `external_reference`
    const paymentData: any = {
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

    if (payment_method_id === "credit_card") {
      paymentData.token = token;
      paymentData.installments = installments;
    }

    console.log("Enviando dados de pagamento para Mercado Pago:", paymentData);

    const response = await mercadopago.payment.create(paymentData);

    console.log("Resposta do Mercado Pago:", response.body);

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
              response.body.point_of_interaction.transaction_data.qr_code_base64,
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
      error: error.response?.data || error.message,
    });
  }
};