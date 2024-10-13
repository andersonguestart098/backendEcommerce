import express from 'express';
import cors from 'cors'; // Importar o CORS
import productRoutes from './routes/productRoutes';
import bannerRoutes from './routes/bannerRoutes';

const app = express();

// Configurar o CORS
app.use(cors({
    origin: 'http://localhost:3000', // Permitir apenas o seu frontend local
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Cabeçalhos permitidos
}));

app.use(express.json());

// Rotas
app.use('/products', productRoutes);

app.use('/banners', bannerRoutes);  

// Porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
