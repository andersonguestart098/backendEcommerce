import { Request, Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { emitOrderStatusUpdate } from "../utils/events"; // Verifique se esse utilitário emite eventos em tempo real
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

  const type = req.body.type || req.query.topic;
  const paymentId = parseInt(req.body.data?.id || req.query.id, 10);

  if (type === "payment" && paymentId) {
    try {
      const paymentResponse = await mercadopago.payment.findById(paymentId);
      const payment = paymentResponse.body;
      const orderId = payment.external_reference;
      const status = payment.status;

      if (!orderId) {
        console.error("ID do pedido não encontrado no pagamento.");
        res.status(400).json({ message: "ID do pedido não encontrado." });
        return;
      }

      // Atualize os mapeamentos de status para refletir os valores corretos do enum `OrderStatus`
      let prismaStatus: OrderStatus;
      if (status === "approved") {
        prismaStatus = OrderStatus.PAYMENT_APPROVED; // Altere para `PAYMENT_APPROVED`
      } else if (status === "rejected") {
        prismaStatus = OrderStatus.REJECTED;
      } else {
        prismaStatus = OrderStatus.PENDING;
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: prismaStatus },
      });

      emitOrderStatusUpdate(orderId, prismaStatus, updatedOrder.userId);
      console.log(`Pedido ${orderId} atualizado para status: ${prismaStatus}`);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook", error });
    }
  } else {
    console.error("Requisição de webhook inválida ou dados ausentes");
    res.status(400).json({ message: "Dados de webhook inválidos" });
  }
};
