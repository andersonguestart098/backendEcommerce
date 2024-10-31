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
import paymentRoutes from "./routes/paymentRoutes";

const mercadopago = require("mercadopago");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configuração do Mercado Pago
mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
);

// Configurações de CORS robusta
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-git-master-andersonguestart098s-projects.vercel.app",
    "https://ecommerce-7o0oh2qpf-andersonguestart098s-projects.vercel.app",
    "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true,
};

// Middlewares
app.use(express.json()); // 1. Interpreta o JSON da requisição primeiro
app.use(cors(corsOptions)); // 2. Aplica o CORS a todas as rotas e origens permitidas
app.options("*", cors(corsOptions)); // 3. Responde a todas as requisições OPTIONS automaticamente

// Rotas principais
app.get("/", (req, res) => {
  res.send("Servidor funcionando.");
});

// Rotas da API
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/api", webhookRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/payment", cors(corsOptions), paymentRoutes); // Aplica CORS específico para a rota de pagamento

// Rotas de feedback de pagamento
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
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ecommerce-git-master-andersonguestart098s-projects.vercel.app",
      "https://ecommerce-7o0oh2qpf-andersonguestart098s-projects.vercel.app",
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
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
