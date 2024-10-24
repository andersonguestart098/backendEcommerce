"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
const uploadMiddleware = productController_1.upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'colors', maxCount: 10 },
]);
// Product routes
router.get('/', productController_1.getAllProducts); // Adjusted to handle query parameters for search & filters
router.get('/:id', productController_1.getProductById);
// Route for creating product with image upload
router.post('/', uploadMiddleware, productController_1.createProduct);
exports.default = router;
