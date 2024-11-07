import jwt from "jsonwebtoken";

export const verifyTokenAndExtractUserId = (token: string): string => {
  const secret = process.env.JWT_SECRET || "sua-chave-secreta";
  const decoded = jwt.verify(token, secret) as { id: string };
  return decoded.id;
};
