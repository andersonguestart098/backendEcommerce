import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import mercadopago from "mercadopago";

const prisma = new PrismaClient();
mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
);

export const handleMercadoPagoWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id, type, action, data } = req.body;

  if (type === "payment" && action === "payment.updated" && data && data.id) {
    try {
      const paymentId = parseInt(data.id, 10);

      if (isNaN(paymentId)) {
        console.error("ID de pagamento inválido");
        res.sendStatus(400);
        return;
      }

      // Continuar com o processamento do pagamento
      const payment = await mercadopago.payment.findById(paymentId);
      const orderId = payment.body.external_reference;
      const status = payment.body.status;

      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      console.log(`Pedido ${orderId} atualizado para status: ${status}`);
      res.sendStatus(200);
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(400);
  }
};
