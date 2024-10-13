import { Router } from 'express';
import { getBannerImages, uploadBannerImage, upload } from '../controllers/bannerController';  // Certifique-se de que está importando corretamente

const router = Router();

// Rota para buscar as imagens dos banners
router.get('/', getBannerImages);

// Rota para fazer o upload de um novo banner
router.post('/upload', upload.single('file'), uploadBannerImage);  // 'file' é o nome do campo do arquivo no form-data

export default router;
