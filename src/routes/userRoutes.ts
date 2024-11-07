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
    try {
      const token = req.headers["x-auth-token"] as string;

      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }

      const userId = verifyTokenAndExtractUserId(token);

      if (!userId) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
      }

      console.log("Buscando usuário com ID:", userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { address: true }, // Inclui o endereço associado
      });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      console.log("Usuário encontrado:", user);
      res.json(user);
    } catch (error) {
      console.error("Erro inesperado no endpoint /profile:", error);
      res.status(500).json({ message: "Erro ao buscar perfil do usuário" });
    }
  })
);

router.put(
  "/update",
  handleAsyncErrors(async (req: Request, res: Response) => {
    try {
      const token = req.headers["x-auth-token"] as string;

      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }

      const userId = verifyTokenAndExtractUserId(token);

      if (!userId) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
      }

      const { name, cpf, phone, address } = req.body;

      console.log(`Atualizando usuário com ID: ${userId}`);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          cpf,
          phone,
          address: {
            upsert: {
              create: address, // Cria o endereço se não existir
              update: address, // Atualiza o endereço existente
            },
          },
        },
        include: { address: true }, // Retorna o endereço atualizado
      });

      return res
        .status(200)
        .json({ message: "Usuário atualizado com sucesso", updatedUser });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  })
);

export default router;
