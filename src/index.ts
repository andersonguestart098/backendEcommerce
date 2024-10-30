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

const mercadopago = require("mercadopago");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuração do Mercado Pago
mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
);

// Configurações de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-git-master-andersonguestart098s-projects.vercel.app",
    "https://ecommerce-mkjgfjm4w-andersonguestart098s-projects.vercel.app",
    'https://ecommerce-9sq2zkod6-andersonguestart098s-projects.vercel.app'
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Rota raiz
app.get("/", (req, res) => {
  res.send("Servidor funcionando.");
});

// Rota de pagamento
app.use("/payment", paymentRoutes);

// Outras rotas
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/api", webhookRoutes);
app.use("/webhooks", webhookRoutes);

// Rota de status de pagamento para feedback do usuário
app.get("/sucesso", (req, res) => {
  console.log("Pagamento bem-sucedido:", req.query);
  res.send("Pagamento realizado com sucesso!");
});

app.get("/falha", (req, res) => {
  console.log("Pagamento falhou:", req.query);
  res.send("Falha no pagamento. Por favor, tente novamente.");
});

app.get("/pendente", (req, res) => {
  console.log("Pagamento pendente:", req.query);
  res.send("Seu pagamento está pendente. Aguarde a confirmação.");
});

// Configuração do WebSocket
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
const emitOrderStatusUpdate = (
  orderId: string,
  newStatus: string,
  userId: string
) => {
  io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export { emitOrderStatusUpdate };
