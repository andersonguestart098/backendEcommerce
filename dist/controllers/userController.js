"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany(); // Usando o Prisma para buscar todos os usuários
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: "Erro ao buscar usuários" });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            res.status(404).json({ message: "Usuário não encontrado" });
        }
        else {
            res.json(user);
        }
    }
    catch (err) {
        res.status(500).json({ message: "Erro ao buscar usuário" });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    const { name, email, password, tipoUsuario } = req.body; // Incluindo tipoUsuario
    try {
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password,
                tipoUsuario, // Certifique-se de fornecer tipoUsuario
            },
        });
        res.status(201).json(newUser);
    }
    catch (err) {
        res.status(500).json({ message: "Erro ao criar usuário" });
    }
};
exports.createUser = createUser;
// Função de registro de usuário com bcrypt
const registerUser = async (req, res) => {
    const { name, email, password, tipoUsuario } = req.body; // Incluindo tipoUsuario
    try {
        // Verifica se o usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({ message: "Usuário já existe" });
            return;
        }
        // Gera o hash da senha
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Cria um novo usuário com a senha hash
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                tipoUsuario, // Incluindo tipoUsuario
            },
        });
        res.status(201).json(newUser);
    }
    catch (err) {
        res.status(500).json({ message: "Erro no servidor ao registrar usuário" });
    }
};
exports.registerUser = registerUser;
