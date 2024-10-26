import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emitOrderStatusUpdate } from "..";
import mercadopago from 'mercadopago';


const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tipoUsuario: string;
  };
}


// Fetch a specific order by ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
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
      products: order.products.filter(orderProduct => orderProduct.product !== null),
    };

    res.json(refinedOrder);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
};


// Função para criar pedido e configurar a preferência de pagamento
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { products, totalPrice, shippingCost } = req.body;
  const userId = authReq.user.id;

  try {
    // Criação do pedido no banco de dados
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        shippingCost,
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
      auto_return: "approved" as const, // Certificando o valor como compatível
      statement_descriptor: "Seu E-commerce",
      external_reference: order.id.toString(),
    };

    // Criação da preferência de pagamento no Mercado Pago
    const mercadoPagoResponse = await mercadopago.preferences.create(preference);

    res.status(201).json({
      order,
      init_point: mercadoPagoResponse.body.init_point, // URL de checkout do Mercado Pago
    });
  } catch (err) {
    console.error("Erro ao criar pedido ou preferência de pagamento:", err);
    res.status(500).json({ message: "Erro ao criar pedido ou preferência de pagamento" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
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
    res.status(403).json({ message: "Access denied: only admins can change order status" });
    return;
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // Emit the update event
    emitOrderStatusUpdate(order.id, status, order.userId); // Ensure emit function has access to WebSocket logic

    res.json({ message: "Status updated successfully", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
};

