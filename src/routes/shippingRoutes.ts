import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

console.log("Arquivo shippingRoutes.ts foi carregado.");

let melhorEnvioToken: string = ""; 
let tokenExpiration: number | null = null;

// Função para verificar se o token está expirado
const isTokenExpired = (): boolean => {
  const bufferTime = 5 * 60 * 1000; // 5 minutos de margem
  const isExpired = !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
  console.log(`Token está expirado? ${isExpired}`);
  return isExpired;
};

// Função para obter a URL da API com base no ambiente
const getApiUrl = (): string => {
  return process.env.MELHOR_ENVIO_ENV === "production"
    ? "https://api.melhorenvio.com.br"
    : "https://sandbox.melhorenvio.com.br";
};

// Função para renovar o token de acesso
const refreshToken = async (): Promise<void> => {
  try {
    console.log("Renovando o token...");
    const apiUrl = process.env.MELHOR_ENVIO_API_URL || "https://api.melhorenvio.com.br";
    
    const response = await axios.post(
      `${apiUrl}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials"
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.status === 200 && response.data.access_token) {
      melhorEnvioToken = response.data.access_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000;
      console.log("Token atualizado:", melhorEnvioToken);
    } else {
      throw new Error("Falha ao obter token de acesso.");
    }
  } catch (error: any) {
    console.error("Erro ao renovar o token:", error.message);
    throw new Error("Erro ao renovar o token. Verifique as credenciais e o ambiente.");
  }
};

const getAccessToken = async (): Promise<string> => {
  console.log("Obtendo token de acesso...");
  if (!melhorEnvioToken || isTokenExpired()) {
    console.log("Token não encontrado ou expirado, renovando token...");
    await refreshToken();
  } else {
    console.log("Token de acesso ainda válido.");
  }
  return melhorEnvioToken;
};

const calculateShipping = async (req: express.Request, res: express.Response) => {
  try {
    const token = await getAccessToken();
    console.log("Token obtido para requisição:", token);

    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`,
      {
        from: { postal_code: req.body.cepOrigem },
        to: { postal_code: req.body.cepDestino },
        package: {
          height: req.body.height || 1,
          width: req.body.width || 1,
          length: req.body.length || 1,
          weight: req.body.weight || 0.1,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Aplicação anderson.guestart98@gmail.com",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Erro na resposta da API de cálculo de frete:", error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error("Erro ao calcular frete:", error.message);
      res.status(500).json({ error: "Erro ao calcular frete." });
    }
  }
};

// Rota para cálculo de frete
router.post("/calculate", calculateShipping as express.RequestHandler);

// Rota para verificar o token atual (opcional, para debugging)
router.get("/token", async (req: express.Request, res: express.Response) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    res.status(500).send("Erro ao obter o token de acesso");
  }
});
export default router;
