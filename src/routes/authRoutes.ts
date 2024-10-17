import { Router } from "express";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Registro de usuário
router.post(
  "/register",
  [
    check("email", "Por favor, adicione um email válido").isEmail(),
    check("password", "A senha deve ter no mínimo 6 caracteres").isLength({
      min: 6,
    }),
    check("name", "Por favor, adicione um nome").not().isEmpty(), // Verificação do campo "name"
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body; // Incluindo "name"

    try {
      // Verificar se o usuário já existe
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: "Usuário já existe" });
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Criar novo usuário com o nome incluído
      user = await prisma.user.create({
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

      jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: "1h" },
        (err: any, token: any) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send("Erro no servidor");
    }
  }
);

// Login de usuário
router.post(
  "/login",
  [
    check("email", "Por favor, adicione um email válido").isEmail(),
    check("password", "Por favor, insira a senha").exists(),
  ],
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ msg: "Usuário não encontrado" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
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

      jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: "100y" },
        (err: any, token: any) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send("Erro no servidor");
    }
  }
);

export default router;
