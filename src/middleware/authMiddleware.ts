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
  console.log("authMiddleware: Verificando token...");

  const token = req.headers["x-auth-token"] as string;

  if (!token) {
    console.warn("authMiddleware: Token não encontrado nos headers.");
    res.status(401).json({ msg: "Sem token, autorização negada" });
    return;
  }

  try {
    console.log("authMiddleware: Token encontrado. Verificando...");
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret-key"
    ) as { user: AuthenticatedUser };

    if (!decoded || !decoded.user) {
      console.error("authMiddleware: Token inválido ou usuário não encontrado no payload.");
      res.status(401).json({ msg: "Token inválido, usuário não encontrado" });
      return;
    }

    const user = decoded.user;
    (req as AuthenticatedRequest).user = user;
    console.log(`authMiddleware: Usuário autenticado - ID: ${user.id}, Tipo: ${user.tipoUsuario}`);

    // Verificação do tipo de usuário
    if ((req.path === '/me' && user.tipoUsuario !== 'cliente') || 
        (req.path !== '/me' && user.tipoUsuario !== 'admin')) {
      console.warn(`authMiddleware: Acesso negado para tipo de usuário: ${user.tipoUsuario}`);
      res.status(403).json({ msg: "Acesso negado para este tipo de usuário." });
      return;
    }

    console.log("authMiddleware: Permissão concedida. Prosseguindo para a próxima função...");
    next();
  } catch (err) {
    console.error("authMiddleware: Erro ao verificar token:", err);
    res.status(401).json({ msg: "Token inválido" });
  }
};


export default authMiddleware;
