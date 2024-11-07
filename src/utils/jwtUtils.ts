import jwt from "jsonwebtoken";

export const verifyTokenAndExtractUserId = (token: string): string => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    console.log("Token decodificado com sucesso:", decoded);
    return (decoded as { id: string }).id;
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    throw new Error("Token inválido ou expirado");
  }
};
