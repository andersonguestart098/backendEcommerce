import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, upload } from '../controllers/productController';

const router = Router();

// Rotas para produtos
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Rota para criação de produto com upload de imagem
router.post('/', upload.single('image'), createProduct);

export default router;
