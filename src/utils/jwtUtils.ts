import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "c9c1a3db8715522878241d08441ab8ba491242cb7a3087e15dbe9fd31e943179bec1cd4411b9bda5250c0ef60b418e921cda7c466b366171f7f88c96d330d59a";

export const verifyTokenAndExtractUserId = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user: { id: string } };
    console.log("Token decodificado com sucesso:", decoded);
    return decoded.user.id;
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return null;
  }
};
