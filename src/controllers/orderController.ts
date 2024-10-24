import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emitOrderStatusUpdate } from "..";

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

  try {
    let orders;
    if (req.path === '/me' && userRole !== 'admin') {
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

    const refinedOrders = orders.map(order => ({
      ...order,
      products: order.products.filter(orderProduct => orderProduct.product !== null),
    }));

    res.json(refinedOrders);
  } catch (err) {
    console.error("Database query error:", err); // Added logging for better troubleshooting
    res.status(500).json({ message: "Error fetching orders" });
  }
};


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

// Create a new order
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
    res.status(500).json({ message: "Error creating order" });
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