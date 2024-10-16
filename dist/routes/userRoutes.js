"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get("/", userController_1.getAllUsers); // Rota para listar todos os usuários
router.get("/:id", userController_1.getUserById); // Rota para obter um usuário por ID
router.post("/", userController_1.createUser); // Rota para criar um novo usuário (sem hash de senha)
router.post("/register", userController_1.registerUser); // Rota para registro de usuário com hash de senha
exports.default = router;
