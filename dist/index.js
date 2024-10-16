"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const bannerRoutes_1 = __importDefault(require("./routes/bannerRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Importa as rotas de usuários
const authMiddleware_1 = __importDefault(require("./middleware/authMiddleware"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configurar o CORS
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // Permitir apenas o frontend local
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
}));
app.use(express_1.default.json());
// Rotas
app.use("/products", productRoutes_1.default);
app.use("/banners", bannerRoutes_1.default);
app.use("/users", userRoutes_1.default); // Adicionar rotas de usuário
app.use("/auth", authRoutes_1.default);
app.get("/private-route", authMiddleware_1.default, (req, res) => {
    res.send("Acesso autorizado");
});
// Porta do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
