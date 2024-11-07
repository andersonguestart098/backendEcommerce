import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";
import multer from "multer";
import fs from "fs/promises"; // Para remover arquivos temporários

// Configure Multer for multiple file uploads
const storage = multer.diskStorage({});
export const upload = multer({ storage });

// Function to handle multiple file fields
export const createUploadMiddleware = () => {
  return upload.fields([
    { name: "images", maxCount: 5 },
    { name: "colors", maxCount: 10 }, // Certifique-se de aceitar 'colors'
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
    const result = await cloudinary.v2.uploader.upload(filePath, { folder });
    await fs.unlink(filePath); // Remove o arquivo local após o upload
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Image upload failed");
  }
};

// Get all products with optional filters
export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        mode: "insensitive",
      };
    }

    if (color) {
      query.where.colors = {
        some: {
          name: {
            contains: String(color),
            mode: "insensitive",
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
    res.status(500).json({ message: "Error fetching products", error: err });
  }
};

// Get product by ID
export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { colors: true, paymentOptions: true }, // Include related data
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
    } else {
      res.json(product);
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err });
  }
};

// Create a new product
export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name,
    price,
    description,
    discount,
    paymentOptions,
    colorNames,
    metersPerBox,
    weightPerBox,
    boxDimensions,
    materialType,
    freightClass,
  } = req.body;

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files["images"] || files["images"].length === 0) {
      res.status(400).json({ message: "Main images not sent" });
      return;
    }

    if (
      !files["colors"] ||
      !colorNames ||
      files["colors"].length !== colorNames.length
    ) {
      res.status(400).json({
        message: "Color images and names must match and cannot be empty",
      });
      return;
    }

    const imageFiles = files["images"];
    const colorFiles = files["colors"];
    const colorNamesArray = Array.isArray(colorNames)
      ? colorNames
      : [colorNames];

    // Upload main images
    const imageUrls = await Promise.all(
      imageFiles.map((file) =>
        uploadImageToCloudinary(file.path, "product_images")
      )
    );

    // Create product
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

    // Add payment options
    if (paymentOptions && Array.isArray(paymentOptions)) {
      await prisma.paymentOption.createMany({
        data: paymentOptions.map((option: string) => ({
          option,
          productId: newProduct.id,
        })),
      });
    }

    // Upload color images
    await Promise.all(
      colorFiles.map(async (file, index) => {
        const colorImageUrl = await uploadImageToCloudinary(
          file.path,
          "pisoColors"
        );
        await prisma.color.create({
          data: {
            name: colorNamesArray[index],
            image: colorImageUrl,
            productId: newProduct.id,
          },
        });
      })
    );

    // Return created product with relations
    const updatedProduct = await prisma.product.findUnique({
      where: { id: newProduct.id },
      include: { colors: true, paymentOptions: true },
    });

    res.status(201).json(updatedProduct);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Error creating product", error: err });
  }
};
