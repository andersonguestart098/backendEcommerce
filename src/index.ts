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

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Novo cliente conectado");
  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

app.use(cors());
app.use(express.json());

app.use("/payment", paymentRoutes);
app.use("/products", productRoutes);
app.use("/banners", bannerRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/shipping", shippingRoutes);
app.use("/webhooks", webhookRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
