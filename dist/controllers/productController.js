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
exports.createProduct = exports.getProductById = exports.getAllProducts = exports.createUploadMiddleware = exports.upload = void 0;
const client_1 = require("@prisma/client");
const cloudinary_1 = __importDefault(require("cloudinary"));
const multer_1 = __importDefault(require("multer"));
// Configure Multer for multiple file uploads
const storage = multer_1.default.diskStorage({});
exports.upload = (0, multer_1.default)({ storage });
// Function to handle multiple file fields (do not export `.fields()` directly)
const createUploadMiddleware = () => {
    return exports.upload.fields([
        { name: 'images', maxCount: 5 }, // Ajuste para 'images'
        { name: 'colors', maxCount: 5 } // Mantenha 'colors'
    ]);
};
exports.createUploadMiddleware = createUploadMiddleware;
// Initialize Prisma Client
const prisma = new client_1.PrismaClient();
// Configure Cloudinary
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Function to upload an image to Cloudinary in a specific folder
const uploadImageToCloudinary = (filePath, folder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.default.v2.uploader.upload(filePath, {
            folder, // Save in the specified directory
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Image upload failed');
    }
});
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, color, minPrice, maxPrice } = req.query;
    try {
        const query = {
            where: {},
            include: {
                colors: true,
            },
        };
        if (search) {
            query.where.name = {
                contains: String(search),
                mode: 'insensitive',
            };
        }
        if (color) {
            query.where.colors = {
                some: {
                    name: {
                        contains: String(color),
                        mode: 'insensitive',
                    },
                },
            };
        }
        if (minPrice) {
            query.where.price = {
                gte: parseFloat(String(minPrice)),
            };
        }
        if (maxPrice) {
            query.where.price = Object.assign(Object.assign({}, query.where.price), { lte: parseFloat(String(maxPrice)) });
        }
        const products = yield prisma.product.findMany(query);
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err });
    }
});
exports.getAllProducts = getAllProducts;
// Fetch a product by ID
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const product = yield prisma.product.findUnique({
            where: { id },
            include: { colors: true }, // Include colors when fetching by ID
        });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
        }
        else {
            res.json(product);
        }
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching product', error: err });
    }
});
exports.getProductById = getProductById;
// Create a new product
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, price, description, discount, paymentOptions, colorNames, metersPerBox, weightPerBox, boxDimensions, materialType, freightClass } = req.body;
    try {
        const files = req.files;
        // Check if main images are sent
        if (!files || !files['images'] || files['images'].length === 0) {
            res.status(400).json({ message: 'Main images not sent' });
            return;
        }
        // Validate color images and names
        if (!files['colors'] || files['colors'].length === 0 || !colorNames || colorNames.length === 0) {
            res.status(400).json({ message: 'No color or color name sent' });
            return;
        }
        const imageFiles = files['images'];
        const colorFiles = files['colors'];
        const colorNamesArray = Array.isArray(colorNames) ? colorNames : [colorNames];
        if (colorFiles.length !== colorNamesArray.length) {
            res.status(400).json({ message: 'The number of color images and names must match.' });
            return;
        }
        // Upload main images to Cloudinary
        const imageUrls = yield Promise.all(imageFiles.map((file) => uploadImageToCloudinary(file.path, 'product_images')));
        // Create the Product first
        const newProduct = yield prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                discount: parseInt(discount),
                image: JSON.stringify(imageUrls),
                metersPerBox: parseFloat(metersPerBox),
                weightPerBox: parseFloat(weightPerBox),
                boxDimensions,
                materialType,
                freightClass: parseInt(freightClass),
            },
        });
        // Now create the PaymentOptions separately and link them to the Product
        if (Array.isArray(paymentOptions)) {
            yield Promise.all(paymentOptions.map((option) => __awaiter(void 0, void 0, void 0, function* () {
                yield prisma.paymentOption.create({
                    data: {
                        option, // Use the option field correctly
                        productId: newProduct.id, // Relaciona ao ID do produto recém-criado
                    },
                });
            })));
        }
        // Upload color images and save in the database
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
        // Fetch and return the created product with associated colors and payment options
        const updatedProduct = yield prisma.product.findUnique({
            where: { id: newProduct.id },
            include: { colors: true, paymentOptions: true },
        });
        res.status(201).json(updatedProduct);
    }
    catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Error creating product', error: err });
    }
});
exports.createProduct = createProduct;
