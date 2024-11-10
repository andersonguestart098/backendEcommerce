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
  console.log("===== Iniciando criação de pagamento =====");

  const {
    transaction_amount,
    payment_method_id,
    installments = 1,
    token,
    products,
    userId,
    device_id = "default_device_id",
  } = req.body;

  try {
    // Validação inicial
    if (
      !transaction_amount ||
      transaction_amount <= 0.5 ||
      !payment_method_id ||
      (payment_method_id === "credit_card" && !token) ||
      !userId
    ) {
      throw new Error(
        `Dados obrigatórios ausentes ou inválidos. Detalhes: transaction_amount=${transaction_amount}, payment_method_id=${payment_method_id}, token=${token}, userId=${userId}`
      );
    }

    if (
      !products ||
      !Array.isArray(products) ||
      products.some(
        (product: any) =>
          !product.productId ||
          typeof product.unit_price !== "number" ||
          product.unit_price <= 0 ||
          !product.quantity ||
          product.quantity <= 0
      )
    ) {
      throw new Error("Produtos inválidos. Verifique os campos productId, unit_price e quantity.");
    }

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }

    const payer = {
      email: user.email,
      first_name: user.name.split(" ")[0] || "Nome",
      last_name: user.name.split(" ").slice(1).join(" ") || "Sobrenome",
      identification: {
        type: "CPF",
        number: user.cpf || "00000000000",
      },
    };

    // Criação da ordem no banco de dados
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
      include: { products: true },
    });

    const paymentData = {
      transaction_amount,
      description: products.map((p: any) => p.description || p.productId).join(", "),
      payment_method_id,
      payer,
      metadata: { device_id },
      statement_descriptor: "Seu E-commerce",
      notification_url: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
      external_reference: order.id,
      ...(payment_method_id === "credit_card" && { token, installments }),
    };

    console.log("Enviando pagamento para Mercado Pago:", JSON.stringify(paymentData, null, 2));
    const response = await mercadopago.payment.create(paymentData);
    const paymentResponse = response.body;

    console.log("Resposta Mercado Pago:", JSON.stringify(paymentResponse, null, 2));

    res.status(200).json({
      message: "Pagamento processado com sucesso",
      status: paymentResponse.status,
      id: paymentResponse.id,
    });

  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error.message);
    res.status(500).json({ error: error.message });
  }
};