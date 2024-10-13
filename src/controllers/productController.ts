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

// Configurar o Multer para lidar com o upload de múltiplos arquivos
const storage = multer.diskStorage({});
export const upload = multer({ storage });

// Função para fazer upload de imagem no Cloudinary com a pasta especificada
const uploadImageToCloudinary = async (filePath: string, folder: string) => {
    try {
      const result = await cloudinary.v2.uploader.upload(filePath, {
        folder,  // Salvar no diretório especificado
      });
      return result.secure_url;
      
    } catch (error) {
      console.error('Erro ao fazer upload no Cloudinary:', error);
      throw new Error('Erro ao fazer upload de imagem');
    }
  };
  
  export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await prisma.product.findMany({
            include: {
                colors: true, // Incluindo as cores associadas
            },
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error: err });
    }
};


export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colors: true }, // Incluir as cores ao buscar por ID
    });
    if (!product) {
      res.status(404).json({ message: 'Produto não encontrado' });
    } else {
      res.json(product);
    }
  } catch (err) {
    res.status(500).json({ message: 'Erro ao buscar produto', error: err });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    const { name, price, description, discount, paymentOptions, colorNames } = req.body;

    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] }; 
        
        if (!files || !files['image'] || files['image'].length === 0) {
            res.status(400).json({ message: 'Imagem principal não enviada' });
            return;
        }

        if (!files['colors'] || files['colors'].length === 0 || !colorNames || colorNames.length === 0) {
            res.status(400).json({ message: 'Nenhuma cor ou nome de cor foi enviado' });
            return;
        }

        const imageFile = files['image'][0]; 
        const colorFiles = files['colors']; 
        const colorNamesArray = Array.isArray(colorNames) ? colorNames : [colorNames]; // Garantir que seja array

        if (colorFiles.length !== colorNamesArray.length) {
            res.status(400).json({ message: 'O número de imagens de cores e nomes deve ser igual.' });
            return;
        }

        // Logando o processamento de cada cor
        console.log("Processando imagem principal:", imageFile.filename);
        console.log("Processando cores:");

        colorFiles.forEach((file, index) => {
            console.log(`Cor ${index + 1}:`, file.filename, colorNamesArray[index]);
        });

        const imageUrl = await uploadImageToCloudinary(imageFile.path, 'product_images');

        const newProduct = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                discount: parseInt(discount),
                paymentOptions: paymentOptions.split(/\s*,\s*/),
                image: imageUrl,
            },
        });

        await Promise.all(
            colorFiles.map(async (file, index) => {
                const colorImageUrl = await uploadImageToCloudinary(file.path, 'pisoColors');
                const colorName = colorNamesArray[index];
                await prisma.color.create({
                    data: {
                        name: colorName,
                        image: colorImageUrl,
                        productId: newProduct.id,
                    },
                });
            })
        );

        const updatedProduct = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: {
                colors: true,
            },
        });

        res.status(201).json(updatedProduct);
    } catch (err) {
        console.error('Erro ao criar produto:', err);
        res.status(500).json({ message: 'Erro ao criar produto', error: err });
    }
};
