import { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; // Para gerar chaves únicas
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

  console.log("Dados recebidos no backend:", {
    transaction_amount,
    payment_method_id,
    installments,
    token,
    products,
    userId,
    device_id,
  });

  try {
    // Validação inicial de campos obrigatórios
    if (
      !transaction_amount ||
      transaction_amount <= 0.5 ||
      !payment_method_id ||
      !userId
    ) {
      throw new Error(
        `Dados obrigatórios ausentes ou inválidos. Detalhes: transaction_amount=${transaction_amount}, payment_method_id=${payment_method_id}, userId=${userId}`
      );
    }

    // Validação do token para métodos de pagamento que exigem cartão de crédito
    const creditCardMethods = ["credit_card", "visa", "mastercard", "amex"];
    if (creditCardMethods.includes(payment_method_id) && !token) {
      throw new Error("Token obrigatório para pagamentos com cartão de crédito.");
    }

    // Validação dos produtos
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

    console.log("Validações iniciais concluídas.");

    // Busca o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado.`);
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

    console.log("Dados do pagador (payer):", JSON.stringify(payer, null, 2));

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

    console.log("Pedido criado com sucesso no banco:", JSON.stringify(order, null, 2));

    // Configuração dos dados de pagamento
    const paymentData: any = {
      transaction_amount,
      description: products.map((p: any) => p.description || p.productId).join(", "),
      payment_method_id,
      payer,
      statement_descriptor: "Seu E-commerce",
      notification_url: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/webhooks/mercado-pago/webhook",
      external_reference: order.id,
      token, // incluir apenas se for pagamento com cartão de crédito
      installments, // incluir se for parcelamento
    };

    // Gerar chave de idempotência
    const idempotencyKey = uuidv4();

    // Enviar para Mercado Pago com os headers necessários
    const response = await mercadopago.payment.create(paymentData, {
      headers: {
        "X-Idempotency-Key": idempotencyKey, // Garantir idempotência
      },
    });

    const paymentResponse = response.body;

    console.log("Resposta Mercado Pago:", JSON.stringify(paymentResponse, null, 2));

    // Verificação do status da resposta
    if (!paymentResponse || !paymentResponse.status) {
      throw new Error("Resposta do Mercado Pago inválida ou incompleta.");
    }

    res.status(200).json({
      message: "Pagamento processado com sucesso",
      status: paymentResponse.status,
      id: paymentResponse.id,
    });
  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error.response?.data || error.message);

    if (error.response) {
      console.error("Erro de resposta do Mercado Pago:", error.response.data);
    } else {
      console.error("Erro interno:", error.message);
    }

    res.status(500).json({
      message: "Erro ao processar pagamento",
      error: error.response?.data || error.message,
    });
  }
};
