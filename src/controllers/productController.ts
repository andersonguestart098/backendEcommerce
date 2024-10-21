import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cloudinary from 'cloudinary';
import multer from 'multer';

// Configure Multer for multiple file uploads
const storage = multer.diskStorage({});
export const upload = multer({ storage });

// Function to handle multiple file fields (do not export `.fields()` directly)
export const createUploadMiddleware = () => {
  return upload.fields([
    { name: 'images', maxCount: 5 }, // Ajuste para 'images'
    { name: 'colors', maxCount: 5 }  // Mantenha 'colors'
  ]);
};

// Initialize Prisma Client
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload an image to Cloudinary in a specific folder
const uploadImageToCloudinary = async (filePath: string, folder: string) => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder,  // Save in the specified directory
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Image upload failed');
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  const { search, color, minPrice, maxPrice } = req.query;

  try {
    const query: any = {
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
      query.where.price = {
        ...query.where.price,
        lte: parseFloat(String(maxPrice)),
      };
    }

    const products = await prisma.product.findMany(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err });
  }
};

// Fetch a product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colors: true }, // Include colors when fetching by ID
    });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json(product);
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err });
  }
};


// Create a new product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const {
    name, price, description, discount, paymentOptions,
    colorNames, metersPerBox, weightPerBox, boxDimensions,
    materialType, freightClass
  } = req.body;

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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
    const imageUrls = await Promise.all(
      imageFiles.map((file: Express.Multer.File) => uploadImageToCloudinary(file.path, 'product_images'))
    );

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
      await Promise.all(
        paymentOptions.map(async (option: string) => {
          await prisma.paymentOption.create({
            data: {
              option, // Use the option field correctly
              productId: newProduct.id, // Relaciona ao ID do produto recém-criado
            },
          });
        })
      );
    }

    // Upload color images and save in the database
    await Promise.all(
      colorFiles.map(async (file: Express.Multer.File, index: number) => {
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

    // Fetch and return the created product with associated colors and payment options
    const updatedProduct = await prisma.product.findUnique({
      where: { id: newProduct.id },
      include: { colors: true, paymentOptions: true },
    });

    res.status(201).json(updatedProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ message: 'Error creating product', error: err });
  }
};
