import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
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

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configurações de CORS robustas aplicadas diretamente
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com",
    "https://ecommerce-973xz0jrt-andersonguestart098s-projects.vercel.app",
    "https://ecommerce-git-master-andersonguestart098s-projects.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Aplica o CORS globalmente antes das rotas
app.use(cors(corsOptions));
app.use(express.json());

// Configuração do Socket.IO com CORS e suporte WebSocket
const io = new SocketIOServer(server, {
  path: "/socket.io",
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials,
  },
});

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

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
