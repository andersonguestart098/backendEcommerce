// controllers/paymentController.ts
import { Request, Response } from "express";
import mercadopago from "mercadopago";

export const createPayment = async (req: Request, res: Response) => {
  const payment_data = {
    transaction_amount: req.body.amount || 100,
    description: req.body.description || "Produto de teste",
    payment_method_id: req.body.payment_method_id || "pix",
    installments: req.body.installments || 1, // Número de parcelas, padrão para 1
    payer: {
      email: req.body.email || "test_user@test.com",
    },
  };

  try {
    const response = await mercadopago.payment.create(payment_data);
    console.log("Pagamento criado com sucesso:", response.body);
    res.status(200).json({ message: "Pagamento criado com sucesso", data: response.body });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
