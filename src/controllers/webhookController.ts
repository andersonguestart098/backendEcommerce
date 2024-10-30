import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const mercadopago = require("mercadopago");

const prisma = new PrismaClient();
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");

export const handleMercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  console.log("Webhook recebido:", req.body);

  const { id, type, action, data } = req.body;

  if (type === "payment" && action === "payment.updated" && data && data.id) {
    try {
      const paymentId = parseInt(data.id, 10);
      console.log("ID do pagamento:", paymentId);

      if (isNaN(paymentId)) {
        console.error("ID de pagamento inválido");
        res.sendStatus(400);
        return;
      }

      // Buscar o pagamento pelo ID para extrair informações
      const payment = await mercadopago.payment.findById(paymentId);
      console.log("Dados do pagamento:", payment.body);

      const orderId = payment.body.external_reference;
      const status = payment.body.status;

      // Verificação de ID nulo
      if (!orderId) {
        console.error("ID do pedido não encontrado (external_reference é nulo)");
        res.sendStatus(400);
        return;
      }

      // Mapear o status para um valor compatível com o Prisma (OrderStatus)
      const prismaStatus = status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING";

      await prisma.order.update({
        where: { id: orderId },
        data: { status: prismaStatus },
      });

      console.log(`Pedido ${orderId} atualizado para status: ${prismaStatus}`);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.sendStatus(500);
    }
  } else {
    console.error("Requisição de webhook inválida ou dados ausentes");
    res.sendStatus(400);
  }
};
