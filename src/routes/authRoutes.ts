import { Router, Request, Response, NextFunction } from "express";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

interface UserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
    tipoUsuario: string;
  };
}

// Handler para registro de usuário
const registerHandler = async (req: UserRequest, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, password, tipoUsuario } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      res.status(400).json({ msg: "Usuário já existe" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
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

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) {
          console.error(err);
          res.status(500).send("Erro ao gerar token");
          return;
        }
        res.json({ token });
      }
    );
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
};

const loginHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ msg: "Usuário não encontrado" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Senha inválida" });
      return;
    }

    const payload = {
      user: {
        id: user.id,
        name: user.name,
        tipoUsuario: user.tipoUsuario,
      },
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ msg: "Erro no servidor: JWT_SECRET não configurado" });
      return;
    }

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "100y" },
      (err, token) => {
        if (err) {
          console.error(err);
          res.status(500).send("Erro ao gerar token");
          return;
        }

        // Emitir evento de boas-vindas usando o io do Socket.IO
        req.app.get("io").emit("welcomeMessage", `Bem-vindo(a), ${user.name}!`);

        // Responder com o token e os dados do usuário
        res.json({ token, user: payload.user });
      }
    );
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Erro no servidor");
  }
};


// Rotas
router.post("/register", [
  check("email", "Por favor, adicione um email válido").isEmail(),
  check("password", "A senha deve ter no mínimo 6 caracteres").isLength({ min: 6 }),
  check("name", "Por favor, adicione um nome").not().isEmpty(),
  check("tipoUsuario", "Por favor, adicione o tipo de usuário").not().isEmpty()
], (req: any, res: any, next: any) => registerHandler(req as UserRequest, res, next));

router.post("/login", [
  check("email", "Por favor, adicione um email válido").isEmail(),
  check("password", "Por favor, insira a senha").exists()
], loginHandler);

export default router;
