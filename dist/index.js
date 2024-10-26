"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOrderStatusUpdate = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const corsMiddleware_1 = __importDefault(require("./middleware/corsMiddleware")); // Importando o middleware CORS
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const bannerRoutes_1 = __importDefault(require("./routes/bannerRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const authMiddleware_1 = __importDefault(require("./middleware/authMiddleware"));
const dotenv_1 = __importDefault(require("dotenv"));
const shippingRoutes_1 = __importDefault(require("./routes/shippingRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
            "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
        credentials: true,
    },
});
// Use o middleware CORS importado
app.use(corsMiddleware_1.default);
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Servidor funcionando.");
});
// Rotas
app.use("/products", productRoutes_1.default);
app.use("/banners", bannerRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/auth", authRoutes_1.default);
app.use("/orders", orderRoutes_1.default);
app.use("/shipping", shippingRoutes_1.default);
app.get("/", (req, res) => {
    res.send("Servidor rodando. Acesse as rotas configuradas para mais funcionalidades.");
});
app.get("/private-route", authMiddleware_1.default, (req, res) => {
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
    socket.on("userLoggedIn", (userName) => {
        console.log(`Usuário logado: ${userName}`);
        socket.emit("welcomeMessage", `Bem-vindo(a), ${userName}!`);
    });
    socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
    });
});
// Emit event when the order status changes
const emitOrderStatusUpdate = (orderId, newStatus, userId) => {
    // Emit only to the specific user related to the order
    io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
// Porta do servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
