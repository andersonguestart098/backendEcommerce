import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let melhorEnvioToken: string = ""; // Inicialize como string vazia
let tokenExpiration: number | null = null;

// Função para obter o token de acesso do Melhor Envio
const getAccessToken = async (): Promise<string> => {
  if (melhorEnvioToken && tokenExpiration && tokenExpiration > Date.now()) {
    return melhorEnvioToken; // Se o token ainda for válido, reutilize-o
  }

  try {
    console.log("Iniciando a obtenção do token de acesso...");
    const response = await axios({
      method: "POST",
      url: `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials",
      }).toString(),
      timeout: 10000,
    });

    if (response.status !== 200 || !response.data.access_token) {
      throw new Error(
        "Falha ao obter o token de acesso. Verifique as credenciais."
      );
    }

    melhorEnvioToken = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000; // Assumindo que `expires_in` é dado em segundos

    console.log("Access Token obtido com sucesso:", melhorEnvioToken);
    return melhorEnvioToken;
  } catch (error: any) {
    console.error("Erro ao obter token de acesso:", error);
    throw new Error(
      "Falha ao autenticar na API do Melhor Envio. Tente novamente."
    );
  }
};

// Middleware para fornecer o token de acesso
const obterMelhorEnvioToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    res.status(500).send("Erro ao obter o token de acesso");
  }
};

export { getAccessToken, obterMelhorEnvioToken };
