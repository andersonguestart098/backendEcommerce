"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitOrderStatusUpdate = void 0;
// index.ts ou server.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const bannerRoutes_1 = __importDefault(require("./routes/bannerRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const shippingRoutes_1 = __importDefault(require("./routes/shippingRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes")); // Importa a nova rota de pagamentos
const mercadopago_1 = __importDefault(require("mercadopago"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configuração do Mercado Pago
mercadopago_1.default.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN || "");
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
        "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Servidor funcionando.");
});
// Usando as rotas organizadas
app.use("/products", productRoutes_1.default);
app.use("/banners", bannerRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/auth", authRoutes_1.default);
app.use("/orders", orderRoutes_1.default);
app.use("/shipping", shippingRoutes_1.default);
app.use("/api", webhookRoutes_1.default);
app.use("/payment", paymentRoutes_1.default); // Rota para o pagamento
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
const io = new socket_io_1.Server(server, { cors: corsOptions });
io.on("connection", (socket) => {
    console.log("Novo cliente conectado:", socket.id);
    socket.on("userLoggedIn", (userName) => {
        console.log(`Usuário logado: ${userName}`);
        socket.emit("welcomeMessage", `Bem-vindo(a), ${userName}!`);
    });
    socket.on("disconnect", () => {
        console.log("Cliente desconectadoo:", socket.id);
    });
});
// Função para atualizar o status do pedido
const emitOrderStatusUpdate = (orderId, newStatus, userId) => {
    io.to(userId).emit("orderStatusUpdated", { orderId, status: newStatus });
};
exports.emitOrderStatusUpdate = emitOrderStatusUpdate;
// Inicializar o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
