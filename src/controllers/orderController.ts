import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: { products: true }, // Inclui os produtos relacionados no pedido
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { products: true }, // Inclui os produtos relacionados no pedido
        });

        if (!order) {
            res.status(404).json({ message: 'Pedido não encontrado' });
            return;
        }

        res.json(order); // Retorna o pedido como resposta
    } catch (err) {
        console.error('Erro ao buscar pedido:', err);
        res.status(500).json({ message: 'Erro ao buscar pedido' });
    }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { products, totalPrice } = req.body;

    // Certifique-se de que o userId existe, capturado do token de autenticação
    const userId = req.user?.id;

    if (!userId) {
        res.status(400).json({ message: 'Usuário não autenticado' });
        return;
    }

    try {
        // Cria o pedido no banco de dados
        const order = await prisma.order.create({
            data: {
                userId, // Relaciona o pedido ao usuário autenticado
                totalPrice, // Valor total do pedido
                products: {
                    create: products.map((product: any) => ({
                        productId: product.id,
                        quantity: product.quantity,
                    })),
                },
            },
            include: { products: true }, // Inclui os produtos no retorno
        });

        res.status(201).json(order); // Retorna o pedido criado como resposta
    } catch (err) {
        console.error('Erro ao criar pedido:', err);
        res.status(500).json({ message: 'Erro ao criar pedido' });
    }
};