import { Request, Response } from "express";
import mercadopago from "mercadopago";

// Configuração do Mercado Pago com o token de acesso
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

export const createTransparentPayment = async (req: Request, res: Response) => {
  console.log("Iniciando criação de pagamento...");

  const {
    products,
    paymentMethod,
    email,
    firstName,
    lastName,
    shippingCost,
    token,
    transactionAmount,
  } = req.body;

  const paymentData = {
    transaction_amount: transactionAmount,
    token, // Token gerado no frontend pelo SDK do Mercado Pago
    description: "Compra de produtos",
    installments: paymentMethod === "Cartão de Crédito" ? 12 : 1, // Número de parcelas (para cartão de crédito)
    payment_method_id:
      paymentMethod === "Cartão de Crédito" ? "visa" : paymentMethod, // Define o método de pagamento
    payer: {
      email: email || "test_user@test.com",
      first_name: firstName || "Nome",
      last_name: lastName || "Sobrenome",
      identification: {
        type: "CPF", // Tipo de identificação
        number: "12345678909", // Número de identificação (deve vir do frontend em produção)
      },
    },
    statement_descriptor: "Seu E-commerce", // Nome que aparece na fatura do cartão
    notification_url: `${process.env.BACKEND_URL}/webhook`, // URL para notificações do webhook
    additional_info: {
      items: products.map((product: any) => ({
        id: product.id,
        title: product.name,
        description: product.description || "Descrição do produto",
        category_id: product.category_id || "outros",
        quantity: product.quantity,
        unit_price: product.price,
      })),
      payer: {
        first_name: firstName,
        last_name: lastName,
        address: {
          zip_code: "12345-678", // CEP (Exemplo fixo, ajuste conforme necessário)
          street_name: "Rua Exemplo", // Endereço do cliente (Exemplo fixo)
          street_number: 123, // Mudança para número
        },
      },
      shipments: {
        receiver_address: "Rua Exemplo, 123, 1º andar, apt 101, 12345-678", // Campo simplificado para string
      },
    },
  };

  try {
    // Criação do pagamento direto com o token e dados do cliente
    const response = await mercadopago.payment.create(paymentData);
    if (response.body.status === "approved") {
      res.status(200).json({
        message: "Pagamento aprovado",
        status: response.body.status,
        status_detail: response.body.status_detail,
        id: response.body.id,
      });
    } else {
      res.status(200).json({
        message: "Pagamento pendente ou recusado",
        status: response.body.status,
        status_detail: response.body.status_detail,
      });
    }
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    res.status(500).json({ message: "Erro ao criar pagamento", error });
  }
};
