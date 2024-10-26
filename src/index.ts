import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import shippingRoutes from "./routes/shippingRoutes";
import authMiddleware from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuração de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
    "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};

// Aplicando o CORS e parsing de JSON
app.use(cors(corsOptions));
app.use(express.json());

// Rota base para teste do servidor
app.get("/", (req, res) => {
  res.send("Servidor funcionando.");
});

// Importando e usando as rotas
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);



// Rota privada de exemplo usando authMiddleware
app.get("/private-route", authMiddleware, (req, res) => {
  res.send("Acesso autorizado");
});

// Rota para verificar variáveis de ambiente
app.get("/test-env", (req, res) => {
  res.json({
    clientId: process.env.MELHOR_ENVIO_CLIENT_ID,
    secret: process.env.MELHOR_ENVIO_SECRET,
    apiUrl: process.env.MELHOR_ENVIO_API_URL,
  });
});

// Configuração do WebSocket com CORS
const io = new Server(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  socket.on("userLoggedIn", (userName: string) => {
    console.log(`Usuário logado: ${userName}`);
    socket.emit("welcomeMessage", `Bem-vindo(a), ${userName}!`);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Função para emitir evento quando o status do pedido muda
const emitOrderStatusUpdate = (
  orderId: string,
  newStatus: string,
  userId: string
) => {
  io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};

// Iniciando o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export { emitOrderStatusUpdate };
