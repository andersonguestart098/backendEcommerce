import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        // outros campos que você deseja adicionar ao usuário
      };
    }
  }
}
