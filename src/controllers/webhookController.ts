import { Request, Response } from "express";
import { PrismaClient, OrderStatus } from "@prisma/client";
import { emitOrderStatusUpdate } from "../utils/events"; // Certifique-se de que este utilitário está configurado para emitir eventos em tempo real
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

  const { type, action, data } = req.body;

  if (type === "payment" && action === "payment.updated" && data && data.id) {
    try {
      const paymentId = parseInt(data.id, 10);
      if (isNaN(paymentId)) {
        console.error("ID de pagamento inválido");
        res.status(400).json({ message: "ID de pagamento inválido" });
        return;
      }

      const paymentResponse = await mercadopago.payment.findById(paymentId);
      const payment = paymentResponse.body;

      const orderId = payment.external_reference;
      const status = payment.status;

      if (!orderId) {
        console.error(
          "ID do pedido não encontrado (external_reference é nulo)"
        );
        res
          .status(400)
          .json({ message: "ID do pedido não encontrado no pagamento." });
        return;
      }

      // Mapear o status do Mercado Pago para os valores válidos do enum OrderStatus
      let prismaStatus: OrderStatus;
      if (status === "approved") {
        prismaStatus = OrderStatus.APPROVED;
      } else if (status === "rejected") {
        prismaStatus = OrderStatus.REJECTED;
      } else {
        prismaStatus = OrderStatus.PENDING;
      }

      // Atualizar o status do pedido no banco de dados
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: prismaStatus },
      });

      // Emitir evento para atualização de status em tempo real
      emitOrderStatusUpdate(orderId, prismaStatus, updatedOrder.userId);

      console.log(`Pedido ${orderId} atualizado para status: ${prismaStatus}`);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({ message: "Erro ao processar webhook", error });
    }
  } else {
    console.error("Requisição de webhook inválida ou dados ausentes");
    res.status(400).json({ message: "Requisição inválida ou dados ausentes" });
  }
};
