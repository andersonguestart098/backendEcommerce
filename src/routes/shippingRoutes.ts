import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();


console.log("Arquivo shippingRoutes.ts foi carregado.");

// Variáveis para armazenar o token e a validade
let melhorEnvioToken: string = ""; 
let tokenExpiration: number | null = null;

// Função para verificar se o token está próximo de expirar
const isTokenExpired = (): boolean => {
  const bufferTime = 5 * 60 * 1000; // Considera o token expirado se faltar menos de 5 minutos para expirar
  return !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
};

// Função para renovar o token de acesso
const refreshToken = async (): Promise<void> => {
  try {
    console.log("Renovando token de acesso...");
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials",
        scope: "shipping"
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.access_token) {
      melhorEnvioToken = response.data.access_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000;
      console.log("Novo token obtido com sucesso.");
    } else {
      console.error("Falha ao obter o token de acesso. Status:", response.status);
      throw new Error("Falha ao obter o token de acesso.");
    }
  } catch (error: any) {
    if (error.response) {
      console.error("Erro na resposta da API:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("Nenhuma resposta recebida da API:", error.request);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }
    throw new Error("Não foi possível renovar o token de acesso. Verifique as credenciais.");
  }
};

// Função para obter o token de acesso
const getAccessToken = async (): Promise<string> => {
  if (!melhorEnvioToken || isTokenExpired()) {
    await refreshToken();
  }
  return melhorEnvioToken;
};

// Middleware para fornecer o token de acesso do Melhor Envio
const obterMelhorEnvioToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    console.error("Erro ao fornecer o token de acesso:", error);
    res.status(500).send("Erro ao obter o token de acesso");
  }
};

// Função para calcular o frete
const calculateShipping = async (req: Request, res: Response): Promise<void> => {
  const { cepOrigem, cepDestino, produtos } = req.body;

  if (!cepOrigem || !cepDestino || !produtos || produtos.length === 0) {
    res.status(400).send("CEP de origem, destino e produtos são necessários.");
    return;
  }

  try {
    const melhorEnvioToken = await getAccessToken();
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/shipping/calculate`,
      { cepOrigem, cepDestino, produtos },
      {
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Erro ao calcular frete:", error.response?.data || error.message);
    res.status(500).send("Erro ao calcular frete");
  }
};

// Definição das rotas
router.post("/calculate", calculateShipping);
router.get("/token", obterMelhorEnvioToken);
router.get("/test", (req: Request, res: Response) => {
  res.send("Rota de teste funcionando.");
});


export default router;
