import jwt from "jsonwebtoken";

export const verifyTokenAndExtractUserId = (token: string): string => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    return (decoded as { id: string }).id;
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    throw new Error("Token inválido");
  }
};
