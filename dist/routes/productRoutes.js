"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// Rotas para produtos
router.get('/', productController_1.getAllProducts);
router.get('/:id', productController_1.getProductById);
// Rota para criação de produto com upload de imagem
router.post('/', productController_1.upload.fields([
    { name: 'image', maxCount: 1 }, // Imagem principal
    { name: 'colors', maxCount: 10 }, // Imagens de cores
]), productController_1.createProduct);
exports.default = router;
