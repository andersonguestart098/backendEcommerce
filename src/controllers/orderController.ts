// orderController.ts
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

export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userRole = authReq.user.tipoUsuario;
  const userId = authReq.user.id;

  try {
    // Atualiza pedidos onde `shippingCost` é null para 0
    await prisma.order.updateMany({
      where: { shippingCost: null },
      data: { shippingCost: 0 },
    });

    // Busca pedidos de acordo com o tipo de usuário
    let orders;
    if (userRole === "admin") {
      // Se for admin, retorna todos os pedidos em ordem decrescente pela data de criação
      orders = await prisma.order.findMany({
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (userRole === "cliente") {
      // Se for cliente, retorna apenas os pedidos do usuário autenticado
      orders = await prisma.order.findMany({
        where: { userId },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Caso o tipo de usuário não seja válido
      res.status(403).json({
        message: "Acesso negado: tipo de usuário não autorizado",
      });
      return;
    }

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
  const { items, totalAmount, paymentId } = req.body;
  const userId = authReq.user.id;

  try {
    // Criação do pedido no banco de dados com os produtos associados
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: totalAmount,
        shippingCost: 0, // Defina um valor de custo de envio ou ajuste conforme a lógica do seu projeto
        products: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        products: { include: { product: true } },
      },
    });

    // Configuração da preferência de pagamento para o Mercado Pago
    const preference = {
      items: items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      back_urls: {
        success:
          "https://ecommerce-1vm200wq8-andersonguestart098s-projects.vercel.app/sucesso",
        failure:
          "https://ecommerce-1vm200wq8-andersonguestart098s-projects.vercel.app/falha",
        pending:
          "https://ecommerce-1vm200wq8-andersonguestart098s-projects.vercel.app/pendente",
      },
      auto_return: "approved" as const,
      statement_descriptor: "Seu E-commerce",
      external_reference: order.id.toString(),
    };

    // Criação da preferência de pagamento no Mercado Pago
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
    "APPROVED",
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

  if (userRole !== "admin" && status === "CANCELED") {
    res.status(403).json({
      message: "Access denied: only admins can cancel orders",
    });
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

export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response<any>> => {
  // Tipo de retorno ajustado
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
      where: { id: userId }, // userId garantido
      data: {
        name,
        cpf,
        phone,
        address: {
          update: address, // Atualizar o endereço associado
        },
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
