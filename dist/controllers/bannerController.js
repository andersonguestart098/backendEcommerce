"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBannerImages = exports.uploadBannerImage = exports.upload = void 0;
const client_1 = require("@prisma/client");
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
const prisma = new client_1.PrismaClient();
// Configurar o Cloudinary
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configurar o Multer para lidar com upload de arquivos
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage });
// Função auxiliar para fazer upload no Cloudinary utilizando uma Promise
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.v2.uploader.upload_stream({ folder: 'banner' }, (error, result) => {
            if (error) {
                console.error('Erro no upload para o Cloudinary:', error);
                return reject(error);
            }
            console.log('Upload para Cloudinary bem-sucedido:', result);
            resolve(result);
        });
        const bufferStream = require('stream').PassThrough();
        bufferStream.end(file.buffer);
        bufferStream.pipe(uploadStream);
    });
};
// Função para fazer o upload da imagem para o Cloudinary e salvar no banco de dados
const uploadBannerImage = async (req, res) => {
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
                imageUrl: result.secure_url, // Somente URL da imagem
            },
        });
        console.log('Banner salvo no banco de dados:', banner);
        // Retornar o banner salvo no banco de dados
        res.status(200).json(banner);
    }
    catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
    }
};
exports.uploadBannerImage = uploadBannerImage;
// Função para buscar as imagens de banners salvas no MongoDB
const getBannerImages = async (req, res) => {
    try {
        console.log('Buscando banners no banco de dados...');
        const banners = await prisma.banner.findMany(); // Buscar banners do banco de dados
        console.log('Banners encontrados:', banners);
        // Certifique-se de formatar os dados corretamente
        const formattedBanners = banners.map(banner => ({
            imageUrl: banner.imageUrl, // Certifique-se de enviar 'imageUrl'
        }));
        console.log('Banners formatados para resposta:', formattedBanners);
        res.status(200).json(formattedBanners); // Enviar os banners formatados
    }
    catch (error) {
        console.error('Erro ao buscar imagens de banners:', error);
        res.status(500).json({ message: 'Erro ao buscar imagens' });
    }
};
exports.getBannerImages = getBannerImages;
