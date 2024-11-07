import { Router, Request, Response } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  registerUser,
  updateUser,
  getProfile, // Função específica para o perfil
} from "../controllers/userController";
import { handleAsyncErrors } from "../utils/handleAsyncErrors";

const router = Router();

// Rota para obter o perfil do usuário logado
router.get("/profile", handleAsyncErrors(getProfile));

// Outras rotas...
router.get("/", handleAsyncErrors(getAllUsers));
router.get("/:id", handleAsyncErrors(getUserById));
router.post("/", handleAsyncErrors(createUser));
router.post("/register", handleAsyncErrors(registerUser));
router.put("/update", handleAsyncErrors(updateUser));

export default router;
