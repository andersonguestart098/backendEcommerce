import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cloudinary from 'cloudinary';
import multer from 'multer';

// Inicializando o Prisma Client
const prisma = new PrismaClient();

// Configurar o Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar o Multer para lidar com o upload de arquivos
const storage = multer.diskStorage({});
export const upload = multer({ storage });

// Função para fazer upload de imagem no Cloudinary
const uploadImageToCloudinary = async (filePath: string) => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'product_images',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Erro ao fazer upload no Cloudinary:', error);
    throw new Error('Erro ao fazer upload de imagem');
  }
};

// Buscar todos os produtos usando Prisma
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    console.log("Iniciando a busca de todos os produtos...");
    try {
        const products = await prisma.product.findMany();
        console.log("Produtos encontrados:", products);
        res.json(products);
    } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: err });
    }
};

// Buscar produto por ID usando Prisma
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    console.log(`Buscando produto com ID: ${id}`);
    try {
        const product = await prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            console.log(`Produto com ID ${id} não encontrado.`);
            res.status(404).json({ message: 'Produto não encontrado' });
        } else {
            console.log("Produto encontrado:", product);
            res.json(product);
        }
    } catch (err) {
        console.error("Erro ao buscar produto:", err);
        res.status(500).json({ message: 'Erro ao buscar produto', error: err });
    }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    const { name, price, description, discount, paymentOptions } = req.body;
    console.log("Iniciando a criação de um novo produto com os dados:", req.body);
    
    try {
        // Verificar se há uma imagem no request
        if (!req.file) {
            res.status(400).json({ message: 'Nenhuma imagem enviada' });
            return;
        }

        // Fazer o upload da imagem para o Cloudinary
        const imageUrl = await uploadImageToCloudinary(req.file.path);

        // Converter as opções de pagamento em um array de strings
        const paymentOptionsArray = paymentOptions.split(/\s*,\s*/);

        // Criar o produto no banco de dados com a URL da imagem
        const newProduct = await prisma.product.create({
            data: { 
                name, 
                price: parseFloat(price),
                description, 
                discount: parseInt(discount),
                paymentOptions: paymentOptionsArray,
                image: imageUrl
            },
        });

        console.log("Produto criado com sucesso:", newProduct);
        res.status(201).json(newProduct);  // Apenas envie a resposta, sem retorno explícito
    } catch (err) {
        console.error("Erro ao criar produto:", err);
        res.status(500).json({ message: 'Erro ao criar produto', error: err });
    }
};