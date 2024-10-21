import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, upload } from '../controllers/productController';

const router = Router();

const uploadMiddleware = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'colors', maxCount: 10 },
]);

// Product routes
router.get('/', getAllProducts); // Adjusted to handle query parameters for search & filters
router.get('/:id', getProductById);

// Route for creating product with image upload
router.post('/', uploadMiddleware, createProduct);

export default router;
