import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import productRoutes from "./routes/productRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import authMiddleware from "./middleware/authMiddleware";

import dotenv from "dotenv";
import shippingRoutes from "./routes/shippingRoutes";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Configurar o CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://frontend-ecommerce-1ukirvdcj-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);

app.use(express.json());

// Rotas
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);

app.get("/private-route", authMiddleware, (req, res) => {
  res.send("Acesso autorizado");
});

app.get("/test-env", (req, res) => {
  res.json({
    clientId: process.env.MELHOR_ENVIO_CLIENT_ID,
    secret: process.env.MELHOR_ENVIO_SECRET,
    apiUrl: process.env.MELHOR_ENVIO_API_URL,
  });
});

// WebSockets
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

// Emit event when the order status changes
const emitOrderStatusUpdate = (
  orderId: string,
  newStatus: string,
  userId: string
) => {
  // Emit only to the specific user related to the order
  io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};

// Porta do servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export { emitOrderStatusUpdate };
