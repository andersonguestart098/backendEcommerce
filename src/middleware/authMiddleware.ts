import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: any; // Define o tipo de usuário que será salvo no req
}

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers["x-auth-token"] as string;

  if (!token) {
    res.status(401).json({ msg: "Sem token, autorização negada" });
    return; // Certifique-se de retornar para que a função não continue
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret-key"
    ) as any;
    req.user = decoded.user; // Armazenamos o usuário decodificado no req
    next(); // Passa para o próximo middleware ou rota
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
    return; // Retorna para garantir que o tipo de retorno seja `void`
  }
};

export default authMiddleware;
