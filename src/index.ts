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
      "https://ecommerce-byrm6qjfu-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
});

// Configuração do Socket.IO
app.set("io", io);

io.on("connection", (socket: any) => {
  console.log("Novo cliente conectado");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Middleware de log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://ecommerce-66dx8gduh-andersonguestart098s-projects.vercel.app",
      "https://ecommerce-byrm6qjfu-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

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

// Middleware de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Erro capturado pelo middleware:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Erro interno do servidor" });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
