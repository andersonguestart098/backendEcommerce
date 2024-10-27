"use strict";
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
const uploadImageToCloudinary = async (filePath, folder) => {
    try {
        const result = await cloudinary_1.default.v2.uploader.upload(filePath, {
            folder, // Save in the specified directory
        });
        return result.secure_url;
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Image upload failed');
    }
};
const getAllProducts = async (req, res) => {
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
        const products = await prisma.product.findMany(query);
        res.json(products);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err });
    }
};
exports.getAllProducts = getAllProducts;
// Fetch a product by ID
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
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
};
exports.getProductById = getProductById;
// Create a new product
const createProduct = async (req, res) => {
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
        const imageUrls = await Promise.all(imageFiles.map((file) => uploadImageToCloudinary(file.path, 'product_images')));
        // Create the Product first
        const newProduct = await prisma.product.create({
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
            await Promise.all(paymentOptions.map(async (option) => {
                await prisma.paymentOption.create({
                    data: {
                        option, // Use the option field correctly
                        productId: newProduct.id, // Relaciona ao ID do produto recém-criado
                    },
                });
            }));
        }
        // Upload color images and save in the database
        await Promise.all(colorFiles.map(async (file, index) => {
            const colorImageUrl = await uploadImageToCloudinary(file.path, 'pisoColors');
            const colorName = colorNamesArray[index];
            await prisma.color.create({
                data: {
                    name: colorName,
                    image: colorImageUrl,
                    productId: newProduct.id,
                },
            });
        }));
        // Fetch and return the created product with associated colors and payment options
        const updatedProduct = await prisma.product.findUnique({
            where: { id: newProduct.id },
            include: { colors: true, paymentOptions: true },
        });
        res.status(201).json(updatedProduct);
    }
    catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Error creating product', error: err });
    }
};
exports.createProduct = createProduct;
