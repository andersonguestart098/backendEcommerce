import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const mercadopago = require("mercadopago");

const prisma = new PrismaClient();
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");

export const handleMercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  console.log("Webhook recebido:", req.body);

  const { id, type, action, data } = req.body;

  // Verifique se o webhook está relacionado a um pagamento atualizado
  if (type === "payment" && action === "payment.updated" && data && data.id) {
    try {
      const paymentId = parseInt(data.id, 10);
      console.log("ID do pagamento:", paymentId);

      if (isNaN(paymentId)) {
        console.error("ID de pagamento inválido");
        res.sendStatus(400);
        return;
      }

      // Buscar informações detalhadas do pagamento pelo ID
      const paymentResponse = await mercadopago.payment.findById(paymentId);
      const payment = paymentResponse.body;
      console.log("Dados do pagamento:", payment);

      // Extrair o external_reference e status do pagamento
      const orderId = payment.external_reference;
      const status = payment.status;

      if (!orderId) {
        console.error("ID do pedido não encontrado (external_reference é nulo)");
        res.status(400).json({ message: "ID do pedido não encontrado no pagamento." });
        return;
      }

      // Mapear o status para um valor compatível com o Prisma (OrderStatus)
      const prismaStatus = status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING";

      // Atualizar o status do pedido no banco de dados
      await prisma.order.update({
        where: { id: orderId },
        data: { status: prismaStatus },
      });

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
