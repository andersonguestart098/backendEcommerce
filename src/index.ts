// index.ts ou app.ts
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { initializeSocket } from "./utils/events"; // Importe a função para inicializar o socket
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

// Inicialize o Socket.IO antes de qualquer middleware ou rota
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com",
      "https://ecommerce-qgw68k4ji-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true, // Garantir que cookies e headers de autenticação sejam aceitos
  },
  path: "/socket.io",
});

initializeSocket(io); // Passe o Socket.IO para a função de inicialização

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("message", (msg) => {
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Configurações de CORS robustas
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com",
    "https://ecommerce-qgw68k4ji-andersonguestart098s-projects.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions)); // Aplicar CORS antes das rotas
app.use(express.json());

app.use(cors(corsOptions));
app.use(express.json());

// Rotas principais
app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

// Rotas de pagamento e outras rotas
app.use("/payment", paymentRoutes);
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/api", webhookRoutes);
app.use("/webhooks", webhookRoutes);

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
