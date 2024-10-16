"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bannerController_1 = require("../controllers/bannerController"); // Certifique-se de que está importando corretamente
const router = (0, express_1.Router)();
// Rota para buscar as imagens dos banners
router.get('/', bannerController_1.getBannerImages);
// Rota para fazer o upload de um novo banner
router.post('/upload', bannerController_1.upload.single('file'), bannerController_1.uploadBannerImage); // 'file' é o nome do campo do arquivo no form-data
exports.default = router;
