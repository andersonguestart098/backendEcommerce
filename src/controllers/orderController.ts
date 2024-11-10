import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emitOrderStatusUpdate } from "../utils/events";
import { verifyTokenAndExtractUserId } from "../utils/jwtUtils";

const mercadopago = require("mercadopago");

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tipoUsuario: string;
  };
}

// Função para obter todos os pedidos
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;
  const userId = authReq.user.id;

  try {
    await prisma.order.updateMany({
      where: { shippingCost: null },
      data: { shippingCost: 0 },
    });

    let orders;
    if (userRole === "admin") {
      orders = await prisma.order.findMany({
        include: {
          products: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (userRole === "cliente") {
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          products: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      res.status(403).json({ message: "Acesso negado: tipo de usuário não autorizado" });
      return;
    }

    res.json(orders);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
};

// Obter pedido por ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;
  const userRole = authReq.user.tipoUsuario;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        products: { include: { product: true } },
      },
    });

    if (!order || (order.userId !== userId && userRole !== "admin")) {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }

    const refinedOrder = {
      ...order,
      products: order.products.filter((orderProduct) => orderProduct.product !== null),
    };

    res.json(refinedOrder);
  } catch (err) {
    console.error("Erro ao buscar pedido:", err);
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { items, totalAmount }: { items: any[]; totalAmount: number } = req.body; // Corrigir para usar os nomes corretos do req.body
  const userId = authReq.user.id;

  try {
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: totalAmount, // Utiliza totalAmount corretamente
        status: "PENDING",
        products: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unit_price, // Adiciona o preço unitário do item
          })),
        },
      },
      include: {
        products: { include: { product: true } },
      },
    });

    const preference = {
      items: items.map((item) => ({
        title: item.name || item.title, // Usa o nome correto do produto
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      back_urls: {
        success: "https://seu-ecommerce.com/sucesso",
        failure: "https://seu-ecommerce.com/falha",
        pending: "https://seu-ecommerce.com/pendente",
      },
      auto_return: "approved" as const,
      statement_descriptor: "Seu E-commerce",
      external_reference: order.id,
    };

    const mercadoPagoResponse = await mercadopago.preferences.create(preference);

    res.status(201).json({
      order,
      init_point: mercadoPagoResponse.body.init_point,
    });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ message: "Erro ao criar pedido" });
  }
};


// Atualizar status do pedido
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;

  const validStatuses = [
    "PENDING",
    "APPROVED",
    "AWAITING_STOCK_CONFIRMATION",
    "SEPARATED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELED",
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Status inválido" });
    return;
  }

  if (userRole !== "admin" && status === "CANCELED") {
    res.status(403).json({ message: "Apenas admins podem cancelar pedidos" });
    return;
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    emitOrderStatusUpdate(order.id, status, order.userId);

    res.json({ message: "Status atualizado com sucesso", order });
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    res.status(500).json({ message: "Erro ao atualizar status" });
  }
};

// Atualizar informações do usuário
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.headers["x-auth-token"] as string;

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const userId = verifyTokenAndExtractUserId(token);

    if (!userId) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    const { name, cpf, phone, address } = req.body;

    console.log(`Atualizando usuário com ID: ${userId}`);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        cpf,
        phone,
        address: address
          ? {
              upsert: {
                update: address,
                create: { ...address, userId },
              },
            }
          : undefined,
      },
    });

    return res
      .status(200)
      .json({ message: "Usuário atualizado com sucesso", updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
};
