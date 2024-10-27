import { Request, Response } from "express";
import mercadopago from "mercadopago";

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
});

export const createPayment = async (req: Request, res: Response) => {
    console.log("Iniciando criação de pagamento...");

    const { products, totalPrice, paymentMethod, shippingCost, email } = req.body;

    const paymentData = {
        items: products.map((product: any) => ({
            title: product.name,
            quantity: product.quantity,
            currency_id: "BRL" as const,
            unit_price: product.price,
        })),
        payer: {
            email: email || "test_user@test.com",
        },
        payment_methods: {
            // Excluir tipos de pagamento baseados na opção selecionada
            excluded_payment_types:
                paymentMethod === "PIX"
                    ? [{ id: "credit_card" }, { id: "ticket" }] // Excluir cartão de crédito e boleto para PIX
                    : paymentMethod === "Boleto Bancário"
                    ? [{ id: "credit_card" }, { id: "pix" }] // Excluir cartão e PIX para Boleto
                    : paymentMethod === "Cartão de Crédito"
                    ? [{ id: "pix" }, { id: "ticket" }] // Excluir PIX e boleto para Cartão de Crédito
                    : [],
            installments: paymentMethod === "Cartão de Crédito" ? 12 : 1, // Configura parcelas para cartão de crédito
        },
        back_urls: {
            success: "http://localhoste:3000/sucesso",
            failure: "http://localhoste:3000/falha",
            pending: "http://localhoste:3000/pendente",
        },
        auto_return: "approved" as "approved" | "all",
        external_reference: "ID_DO_PEDIDO_AQUI",
    };

    try {
        const response = await mercadopago.preferences.create(paymentData);
        res.status(200).json({ init_point: response.body.init_point });
    } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        res.status(500).json({ message: "Erro ao criar pagamento", error });
    }
};
