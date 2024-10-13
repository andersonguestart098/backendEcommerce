import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, upload } from '../controllers/productController';

const router = Router();

// Rotas para produtos
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Rota para criação de produto com upload de imagem
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 }, // Imagem principal
    { name: 'colors', maxCount: 10 }, // Imagens de cores
]), createProduct);

export default router;
