import { Router, Request, Response } from "express";
import prisma from "../prismaClient"; // Certifique-se de importar corretamente
import { verifyTokenAndExtractUserId } from "../utils/jwtUtils"; // Função que verifica e extrai o ID
import { handleAsyncErrors } from "../utils/handleAsyncErrors";
import {
  getAllUsers,
  getUserById,
  createUser,
  registerUser,
  updateUser, // Importa a função de atualização
} from "../controllers/userController";

const router = Router();

// Rota para listar todos os usuários
router.get("/", handleAsyncErrors(getAllUsers));

// Rota para obter um usuário por ID
router.get("/:id", handleAsyncErrors(getUserById));

// Rota para criar um novo usuário (sem hash de senha)
router.post("/", handleAsyncErrors(createUser));

// Rota para registro de usuário com hash de senha
router.post("/register", handleAsyncErrors(registerUser));

// Rota para obter o perfil do usuário logado
router.get(
  "/profile",
  handleAsyncErrors(async (req: Request, res: Response) => {
    const token = req.headers["x-auth-token"] as string;
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    const userId = verifyTokenAndExtractUserId(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json(user);
  })
);

// Rota para atualizar os dados do usuário autenticado
router.put("/update", handleAsyncErrors(updateUser));

export default router;
