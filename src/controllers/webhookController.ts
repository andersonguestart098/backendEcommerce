import { Request, Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { emitOrderStatusUpdate } from "../utils/events"; // Certifique-se que emite eventos em tempo real
const mercadopago = require("mercadopago");

const prisma = new PrismaClient();

mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
);

export const handleMercadoPagoWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("Webhook recebido:", req.body);

  const type = req.body.type || req.query.topic; // Valida tanto 'type' quanto 'topic'
  const paymentId = parseInt(req.body.data?.id || req.query.id, 10); // Obtém o paymentId

  if (type !== "payment" || !paymentId) {
    console.error("Requisição de webhook inválida ou dados ausentes");
    res.status(400).json({ message: "Dados de webhook inválidos" });
    return;
  }

  try {
    // Buscar detalhes do pagamento via API do Mercado Pago
    const paymentResponse = await mercadopago.payment.findById(paymentId);
    const payment = paymentResponse.body;

    if (!payment) {
      console.error("Pagamento não encontrado.");
      res.status(404).json({ message: "Pagamento não encontrado." });
      return;
    }

    const orderId = payment.external_reference; // ID da ordem enviada no momento da criação do pagamento
    const status = payment.status; // Status do pagamento retornado pelo Mercado Pago

    if (!orderId) {
      console.error("ID do pedido não encontrado no pagamento.");
      res.status(400).json({ message: "ID do pedido não encontrado." });
      return;
    }

    // Mapeia status do Mercado Pago para o status do Prisma
    let prismaStatus: OrderStatus;
    switch (status) {
      case "approved":
        prismaStatus = OrderStatus.APPROVED;
        break;
      case "rejected":
        prismaStatus = OrderStatus.REJECTED;
        break;
      case "pending":
        prismaStatus = OrderStatus.PENDING;
        break;
      case "cancelled":
        prismaStatus = OrderStatus.CANCELED;
        break;
      default:
        prismaStatus = OrderStatus.PENDING;
        break;
    }

    // Atualiza o status do pedido no banco de dados
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: prismaStatus },
    });

    emitOrderStatusUpdate(orderId, prismaStatus, updatedOrder.userId); // Emite atualização para clientes ou sistema

    console.log(`Pedido ${orderId} atualizado para status: ${prismaStatus}`);
    res.sendStatus(200); // Confirma recebimento do webhook
  } catch (error: any) {
    if (error.code === "P2025") {
      // Erro Prisma: registro não encontrado
      console.error(`Pedido com ID ${paymentId} não encontrado no banco.`);
      res.status(404).json({ message: "Pedido não encontrado." });
    } else if (error.status === 404) {
      console.error("Pagamento não encontrado no Mercado Pago.");
      res.status(404).json({ message: "Pagamento não encontrado." });
    } else {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook", error });
    }
  }
};