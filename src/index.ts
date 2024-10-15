import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import userRoutes from "./routes/userRoutes"; // Importa as rotas de usuários
import authMiddleware from "./middleware/authMiddleware";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

// Configurar o CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Permitir apenas o frontend local
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
  })
);

app.use(express.json());

// Rotas
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes); // Adicionar rotas de usuário
app.use("/auth", authRoutes);

app.get("/private-route", authMiddleware, (req, res) => {
  res.send("Acesso autorizado");
});

// Porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
