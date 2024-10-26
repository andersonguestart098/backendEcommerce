"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// middleware/corsMiddleware.ts
const cors_1 = __importDefault(require("cors"));
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ecommerce-83yqvi950-andersonguestart098s-projects.vercel.app",
        "https://demo-vendas-6jk1tuu0m-andersonguestart098s-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true, // Permitir credenciais se necessário
};
exports.default = (0, cors_1.default)(corsOptions);
