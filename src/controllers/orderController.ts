import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: { products: true },
    });
    res.json(orders); // res.json() já envia a resposta
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedidos' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!order) {
      res.status(404).json({ message: 'Pedido não encontrado' });
    } else {
      res.json(order); // Envia a resposta diretamente
    }
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar pedido' });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    console.log("Iniciando criação de pedido");
    const { products, totalPrice } = req.body;
  
    console.log("Produtos recebidos:", products);
    console.log("Preço total:", totalPrice);
  
    const userId = req.user?.id;
    console.log("ID do usuário:", userId);
  
    if (!userId) {
      console.log("Usuário não autenticado");
      res.status(400).json({ message: 'Usuário não autenticado' });
      return;
    }
  
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
  
      console.log("Pedido criado com sucesso:", order);
      res.status(201).json(order);
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).json({ message: 'Erro ao criar pedido' });
    }
  };