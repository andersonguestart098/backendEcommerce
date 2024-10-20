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
  const authReq = req as AuthenticatedRequest; // Cast para AuthenticatedRequest
  const userId = authReq.user.id;
  const userRole = authReq.user.tipoUsuario;

  try {
    let orders;
    if (userRole === "admin") {
      orders = await prisma.order.findMany({
        include: { products: true },
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId },
        include: { products: true },
      });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest; // Cast para AuthenticatedRequest
  const userId = authReq.user.id;
  const userRole = authReq.user.tipoUsuario;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!order || (order.userId !== userId && userRole !== "admin")) {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest; // Cast para AuthenticatedRequest
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
      include: { products: true },
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar pedido" });
  }
};

// Função para atualizar o status do pedido (apenas admin)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const authReq = req as AuthenticatedRequest; // Cast para AuthenticatedRequest
  const userRole = authReq.user.tipoUsuario;

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
    res.status(500).json({ message: "Erro ao atualizar o status do pedido" });
  }
};
