import express from 'express';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes'; // Importando orderRoutes
import userRoutes from './routes/userRoutes';   // Importando userRoutes

const app = express();

app.use(express.json());

app.use('/products', productRoutes); // Rotas de produtos
app.use('/orders', orderRoutes);     // Rotas de pedidos
app.use('/users', userRoutes);       // Rotas de usuários

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
