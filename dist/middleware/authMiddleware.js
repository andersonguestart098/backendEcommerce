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
        return; // Certifique-se de retornar para que a função não continue
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default-secret-key");
        req.user = decoded.user; // Armazenamos o usuário decodificado no req
        next(); // Passa para o próximo middleware ou rota
    }
    catch (err) {
        res.status(401).json({ msg: "Token inválido" });
        return; // Retorna para garantir que o tipo de retorno seja `void`
    }
};
exports.default = authMiddleware;
