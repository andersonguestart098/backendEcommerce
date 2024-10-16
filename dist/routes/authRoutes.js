"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
// Registro de usuário
router.post("/register", [
    (0, express_validator_1.check)("email", "Por favor, adicione um email válido").isEmail(),
    (0, express_validator_1.check)("password", "A senha deve ter no mínimo 6 caracteres").isLength({
        min: 6,
    }),
    (0, express_validator_1.check)("name", "Por favor, adicione um nome").not().isEmpty(), // Verificação do campo "name"
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body; // Incluindo "name"
    try {
        // Verificar se o usuário já existe
        let user = yield prisma.user.findUnique({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: "Usuário já existe" });
        }
        // Hash da senha
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Criar novo usuário com o nome incluído
        user = yield prisma.user.create({
            data: {
                name, // Incluindo o campo "name" aqui
                email,
                password: hashedPassword,
            },
        });
        // Gerar JWT
        const payload = {
            user: {
                id: user.id,
            },
        };
        // Verificar se o JWT_SECRET está definido
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res
                .status(500)
                .json({ msg: "Erro no servidor: JWT_SECRET não configurado" });
        }
        jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
            if (err)
                throw err;
            res.json({ token });
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
}));
// Login de usuário
router.post("/login", [
    (0, express_validator_1.check)("email", "Por favor, adicione um email válido").isEmail(),
    (0, express_validator_1.check)("password", "Por favor, insira a senha").exists(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: "Usuário não encontrado" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Senha inválida" });
        }
        const payload = {
            user: {
                id: user.id,
            },
        };
        // Verificar se o JWT_SECRET está definido
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res
                .status(500)
                .json({ msg: "Erro no servidor: JWT_SECRET não configurado" });
        }
        jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
            if (err)
                throw err;
            res.json({ token });
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
}));
exports.default = router;
