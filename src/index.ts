import express, { Request, Response, NextFunction } from "express";
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
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ecommerce-66dx8gduh-andersonguestart098s-projects.vercel.app",
      "https://demo-anderson-2ikyf9gm0-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configuração do Socket.IO
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Rota raiz para status do servidor
app.get("/", (req, res) => {
  res.send("Servidor Ecommerce Ativo...");
});

// Rotas
app.use("/payment", paymentRoutes);
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/webhooks", webhookRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Erro Detalhado: ", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });
  res.status(500).json({ message: "Erro interno do servidor" });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
