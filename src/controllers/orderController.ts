import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tipoUsuario: string;
  };
}

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const userRole = authReq.user.tipoUsuario;

  console.log("Buscando pedidos para:", { userId, userRole });

  try {
    let orders;
    if (req.path === '/me' && userRole !== 'admin') {
      console.log(`Usuário não é admin, buscando pedidos para o userId: ${userId}`);
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });
    } else {
      console.log("Usuário é admin, buscando todos os pedidos...");
      orders = await prisma.order.findMany({
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // Filtrar produtos nulos e remover entradas inválidas antes de retornar
    const refinedOrders = orders.map(order => ({
      ...order,
      products: order.products.filter(orderProduct => orderProduct.product !== null),
    }));

    console.log("Pedidos encontrados:", refinedOrders);
    res.json(refinedOrders);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
};


// Função para buscar um pedido por ID
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
      res.status(403).json({ message: "Acesso negado" });
      return;
    }

    // Verificar e remover produtos `null`
    const refinedOrder = {
      ...order,
      products: order.products.filter(orderProduct => orderProduct.product !== null),
    };

    res.json(refinedOrder);
  } catch (err) {
    console.error("Erro ao buscar pedido:", err);
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
};

// Função para criar novo pedido
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { products, totalPrice } = req.body;
  const userId = authReq.user.id;

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        products: {
          create: products.map((product: any) => ({
            productId: product.id,
            quantity: product.quantity,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ message: "Erro ao criar pedido" });
  }
};

// Função para atualizar o status do pedido
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;

  console.log("Tentando atualizar status para:", status);

  const validStatuses = ["PENDING", "PAYMENT_APPROVED", "AWAITING_STOCK_CONFIRMATION", "SEPARATED", "DISPATCHED", "DELIVERED", "CANCELED"];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Status inválido" });
    return;
  }

  if (userRole !== "admin") {
    res.status(403).json({ message: "Acesso negado: apenas administradores podem alterar o status do pedido" });
    return;
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json({ message: "Status atualizado com sucesso", order });
  } catch (err) {
    console.error("Erro ao atualizar o status do pedido:", err);
    res.status(500).json({ message: "Erro ao atualizar o status do pedido" });
  }
};
