import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedUser {
  id: string;
  tipoUsuario: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser; // Tornar `user` obrigatório
}

const authMiddleware: RequestHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const token = req.headers["x-auth-token"] as string;

  if (!token) {
    res.status(401).json({ msg: "Sem token, autorização negada" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret-key"
    ) as { user: AuthenticatedUser };

    if (!decoded || !decoded.user) {
      res.status(401).json({ msg: "Token inválido, usuário não encontrado" });
      return;
    }

    (req as AuthenticatedRequest).user = decoded.user; // Cast para AuthenticatedRequest

    next();
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    res.status(401).json({ msg: "Token inválido" });
  }
};

export default authMiddleware;
