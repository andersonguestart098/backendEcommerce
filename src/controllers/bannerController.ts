import { PrismaClient } from '@prisma/client';
import cloudinary from 'cloudinary';
import { Request, Response } from 'express';
import multer from 'multer';

const prisma = new PrismaClient();

// Configurar o Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar o Multer para lidar com upload de arquivos
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Função auxiliar para fazer upload no Cloudinary utilizando uma Promise
const uploadToCloudinary = (file: Express.Multer.File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { folder: 'banner' },
      (error, result) => {
        if (error) {
          console.error('Erro no upload para o Cloudinary:', error);
          return reject(error);
        }
        console.log('Upload para Cloudinary bem-sucedido:', result);
        resolve(result);
      }
    );

    const bufferStream = require('stream').PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

// Função para fazer o upload da imagem para o Cloudinary e salvar no banco de dados
export const uploadBannerImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Nenhuma imagem enviada' });
      return;
    }

    // Fazer upload da imagem para o Cloudinary
    const result = await uploadToCloudinary(req.file);
    console.log('Resultado do Cloudinary:', result);

    // Salvar a URL da imagem no MongoDB via Prisma
    const banner = await prisma.banner.create({
      data: {
        imageUrl: result.secure_url,  // Somente URL da imagem
      },
    });
    console.log('Banner salvo no banco de dados:', banner);

    // Retornar o banner salvo no banco de dados
    res.status(200).json(banner);
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
  }
};

// Função para buscar as imagens de banners salvas no MongoDB
export const getBannerImages = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Buscando banners no banco de dados...');
    const banners = await prisma.banner.findMany(); // Buscar banners do banco de dados

    console.log('Banners encontrados:', banners);

    // Certifique-se de formatar os dados corretamente
    const formattedBanners = banners.map(banner => ({
      imageUrl: banner.imageUrl,  // Certifique-se de enviar 'imageUrl'
    }));

    console.log('Banners formatados para resposta:', formattedBanners);

    res.status(200).json(formattedBanners); // Enviar os banners formatados
  } catch (error) {
    console.error('Erro ao buscar imagens de banners:', error);
    res.status(500).json({ message: 'Erro ao buscar imagens' });
  }
};
