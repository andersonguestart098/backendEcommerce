// index.ts ou server.ts
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
import webhookRoutes from "./routes/webhookRoutes";
import paymentRoutes from "./routes/paymentRoutes"; // Importa a nova rota de pagamentos

import mercadopago from "mercadopago";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuração do Mercado Pago
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");

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

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor funcionando.");
});

// Usando as rotas organizadas
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/api", webhookRoutes);
app.use("/payment", paymentRoutes); // Rota para o pagamento

const io = new Server(server, { cors: corsOptions });

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

// Função para atualizar o status do pedido
const emitOrderStatusUpdate = (orderId: string, newStatus: string, userId: string) => {
  io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export { emitOrderStatusUpdate };
