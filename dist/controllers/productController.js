"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = exports.getProductById = exports.getAllProducts = exports.upload = void 0;
const client_1 = require("@prisma/client");
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
// Inicializando o Prisma Client
const prisma = new client_1.PrismaClient();
// Configurar o Cloudinary
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Configurar o Multer para lidar com o upload de múltiplos arquivos
const storage = multer_1.default.diskStorage({});
exports.upload = (0, multer_1.default)({ storage });
// Função para fazer upload de imagem no Cloudinary com a pasta especificada
const uploadImageToCloudinary = (filePath, folder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.default.v2.uploader.upload(filePath, {
            folder, // Salvar no diretório especificado
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Erro ao fazer upload no Cloudinary:', error);
        throw new Error('Erro ao fazer upload de imagem');
    }
});
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma.product.findMany({
            include: {
                colors: true, // Incluindo as cores associadas
            },
        });
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error: err });
    }
});
exports.getAllProducts = getAllProducts;
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const product = yield prisma.product.findUnique({
            where: { id },
            include: { colors: true }, // Incluir as cores ao buscar por ID
        });
        if (!product) {
            res.status(404).json({ message: 'Produto não encontrado' });
        }
        else {
            res.json(product);
        }
    }
    catch (err) {
        res.status(500).json({ message: 'Erro ao buscar produto', error: err });
    }
});
exports.getProductById = getProductById;
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, price, description, discount, paymentOptions, colorNames } = req.body;
    try {
        const files = req.files;
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
        const imageUrl = yield uploadImageToCloudinary(imageFile.path, 'product_images');
        const newProduct = yield prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                discount: parseInt(discount),
                paymentOptions: paymentOptions.split(/\s*,\s*/),
                image: imageUrl,
            },
        });
        yield Promise.all(colorFiles.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const colorImageUrl = yield uploadImageToCloudinary(file.path, 'pisoColors');
            const colorName = colorNamesArray[index];
            yield prisma.color.create({
                data: {
                    name: colorName,
                    image: colorImageUrl,
                    productId: newProduct.id,
                },
            });
        })));
        const updatedProduct = yield prisma.product.findUnique({
            where: { id: newProduct.id },
            include: {
                colors: true,
            },
        });
        res.status(201).json(updatedProduct);
    }
    catch (err) {
        console.error('Erro ao criar produto:', err);
        res.status(500).json({ message: 'Erro ao criar produto', error: err });
    }
});
exports.createProduct = createProduct;
