"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const token = req.headers["x-auth-token"];
    if (!token) {
        res.status(401).json({ msg: "Sem token, autorização negada" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default-secret-key");
        if (!decoded || !decoded.user) {
            res.status(401).json({ msg: "Token inválido, usuário não encontrado" });
            return;
        }
        req.user = decoded.user; // Cast para AuthenticatedRequest
        next();
    }
    catch (err) {
        console.error("Erro ao verificar token:", err);
        res.status(401).json({ msg: "Token inválido" });
    }
};
exports.default = authMiddleware;
