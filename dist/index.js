"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOrderStatusUpdate = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors")); // Importing CORS directly
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
// Configuração de CORS
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
        "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Include POST explicitly
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true,
};
// Applying CORS and JSON body parsing
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Base route for testing server
app.get("/", (req, res) => {
    res.send("Servidor funcionando.");
});
// Importing routes
app.use("/products", productRoutes_1.default);
app.use("/banners", bannerRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/auth", authRoutes_1.default);
app.use("/orders", orderRoutes_1.default);
app.use("/shipping", shippingRoutes_1.default); // Ensure POST is accepted in `shippingRoutes`
// Private route using authMiddleware
app.get("/private-route", authMiddleware_1.default, (req, res) => {
    res.send("Acesso autorizado");
});
// Route to test environment variables
app.get("/test-env", (req, res) => {
    res.json({
        clientId: process.env.MELHOR_ENVIO_CLIENT_ID,
        secret: process.env.MELHOR_ENVIO_SECRET,
        apiUrl: process.env.MELHOR_ENVIO_API_URL,
    });
});
// WebSockets configuration
const io = new socket_io_1.Server(server, {
    cors: corsOptions, // Applying CORS options to Socket.IO
});
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
    io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
// Server listening on defined PORT
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
