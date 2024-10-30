import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emitOrderStatusUpdate } from "..";
const mercadopago = require("mercadopago");

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tipoUsuario: string;
  };
}

// Função para listar todos os pedidos (apenas para administradores)
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;

  if (userRole !== "admin") {
    res.status(403).json({
      message:
        "Acesso negado: apenas administradores podem ver todos os pedidos",
    });
    return;
  }

  try {
    // Atualiza pedidos onde `shippingCost` é null para 0
    await prisma.order.updateMany({
      where: { shippingCost: null },
      data: { shippingCost: 0 },
    });

    const orders = await prisma.order.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(orders);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
};

// Fetch a specific order by ID
export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const userRole = authReq.user.tipoUsuario;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || (order.userId !== userId && userRole !== "admin")) {
      res.status(403).json({ message: "Access Denied" });
      return;
    }

    // Remove invalid entries
    const refinedOrder = {
      ...order,
      products: order.products.filter(
        (orderProduct) => orderProduct.product !== null
      ),
    };

    res.json(refinedOrder);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

// Função para criar pedido e configurar a preferência de pagamento
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { products, totalPrice, shippingCost } = req.body;
  const userId = authReq.user.id;

  try {
    // Criação do pedido no banco de dados
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        shippingCost: shippingCost || 0, // Garante que o shippingCost seja 0 se estiver ausente
        products: {
          create: products.map((product: any) => ({
            productId: product.id,
            quantity: product.quantity,
          })),
        },
      },
      include: {
        products: { include: { product: true } },
      },
    });

    // Configuração da preferência de pagamento para o Mercado Pago
    const preference = {
      items: products.map((product: any) => ({
        title: product.name,
        quantity: product.quantity,
        unit_price: product.price,
      })),
      back_urls: {
        success: "https://seu-front-end.com/order-confirmation",
        failure: "https://seu-front-end.com/order-failure",
        pending: "https://seu-front-end.com/order-pending",
      },
      auto_return: "approved" as const,
      statement_descriptor: "Seu E-commerce",
      external_reference: order.id.toString(),
    };

    const mercadoPagoResponse = await mercadopago.preferences.create(
      preference
    );

    res.status(201).json({
      order,
      init_point: mercadoPagoResponse.body.init_point,
    });
  } catch (err) {
    console.error("Erro ao criar pedido ou preferência de pagamento:", err);
    res
      .status(500)
      .json({ message: "Erro ao criar pedido ou preferência de pagamento" });
  }
};

// Função para atualizar o status do pedido
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;

  const validStatuses = [
    "PENDING",
    "PAYMENT_APPROVED",
    "AWAITING_STOCK_CONFIRMATION",
    "SEPARATED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELED",
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  if (userRole !== "admin") {
    res
      .status(403)
      .json({ message: "Access denied: only admins can change order status" });
    return;
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    emitOrderStatusUpdate(order.id, status, order.userId);

    res.json({ message: "Status updated successfully", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
};
