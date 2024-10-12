import { Request, Response } from 'express';
import Product from '../models/Product';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar produtos' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            // Retorna uma resposta com status 404 se o produto não for encontrado
            res.status(404).json({ message: 'Produto não encontrado' });
        } else {
            // Retorna o produto encontrado
            res.json(product);
        }
    } catch (err) {
        // Retorna uma resposta de erro 500 em caso de falha
        res.status(500).json({ message: 'Erro ao buscar produto' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    const { name, price, description, discount, paymentOptions } = req.body;
    try {
        const newProduct = new Product({ name, price, description, discount, paymentOptions });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar produto' });
    }
};
