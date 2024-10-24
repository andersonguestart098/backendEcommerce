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
// Handler para registro de usuário
const registerHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, password, tipoUsuario } = req.body;
    try {
        let user = yield prisma.user.findUnique({ where: { email } });
        if (user) {
            res.status(400).json({ msg: "Usuário já existe" });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        user = yield prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                tipoUsuario,
            },
        });
        const payload = {
            user: {
                id: user.id,
                tipoUsuario: user.tipoUsuario,
            },
        };
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ msg: "Erro no servidor: JWT_SECRET não configurado" });
            return;
        }
        jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: "1h" }, (err, token) => {
            if (err) {
                console.error(err);
                res.status(500).send("Erro ao gerar token");
                return;
            }
            res.json({ token });
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});
// Handler para login de usuário
const loginHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    try {
        let user = yield prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ msg: "Usuário não encontrado" });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ msg: "Senha inválida" });
            return;
        }
        const payload = {
            user: {
                id: user.id,
                name: user.name, // Inclua o nome do usuário
                tipoUsuario: user.tipoUsuario,
            },
        };
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ msg: "Erro no servidor: JWT_SECRET não configurado" });
            return;
        }
        jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: "100y" }, (err, token) => {
            if (err) {
                console.error(err);
                res.status(500).send("Erro ao gerar token");
                return;
            }
            // Modifique aqui para incluir os dados do usuário na resposta
            res.json({ token, user: payload.user });
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send("Erro no servidor");
    }
});
// Rotas
router.post("/register", [
    (0, express_validator_1.check)("email", "Por favor, adicione um email válido").isEmail(),
    (0, express_validator_1.check)("password", "A senha deve ter no mínimo 6 caracteres").isLength({ min: 6 }),
    (0, express_validator_1.check)("name", "Por favor, adicione um nome").not().isEmpty(),
    (0, express_validator_1.check)("tipoUsuario", "Por favor, adicione o tipo de usuário").not().isEmpty()
], (req, res, next) => registerHandler(req, res, next));
router.post("/login", [
    (0, express_validator_1.check)("email", "Por favor, adicione um email válido").isEmail(),
    (0, express_validator_1.check)("password", "Por favor, insira a senha").exists()
], loginHandler);
exports.default = router;
