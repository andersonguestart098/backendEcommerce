// productRoutes.ts
import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, upload } from '../controllers/productController';

const router = Router();

const uploadMiddleware = upload.fields([
    { name: 'images', maxCount: 5 }, // Altere para 'images'
    { name: 'colors', maxCount: 10 }, // Mantenha 'colors'
]);

// Rotas para produtos
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Rota para criação de produto com upload de imagem
router.post('/', uploadMiddleware, createProduct);

export default router;
