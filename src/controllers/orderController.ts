import { Request, Response } from 'express';
import Order from '../models/Order';

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) {
            res.status(404).json({ message: 'Pedido não encontrado' });
        } else {
            res.json(order);
        }
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pedido' });
    }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
    const { productIds, totalAmount, userId } = req.body;
    try {
        const newOrder = new Order({ productIds, totalAmount, userId });
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar pedido' });
    }
};
