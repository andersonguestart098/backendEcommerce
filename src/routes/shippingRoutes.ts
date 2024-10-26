// shippingRoutes.ts
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
  const isExpired = !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
  console.log(`Token está expirado? ${isExpired}`);
  return isExpired;
};

// Função para renovar o token de acesso
const refreshToken = async (): Promise<void> => {
  console.log("Iniciando a renovação do token de acesso...");
  try {
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials"
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    if (response.status === 200 && response.data.access_token) {
      melhorEnvioToken = response.data.access_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000;
      console.log("Novo token obtido com sucesso:", melhorEnvioToken);
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
  console.log("Obtendo token de acesso...");
  if (!melhorEnvioToken || isTokenExpired()) {
    console.log("Token não encontrado ou expirado, renovando token...");
    await refreshToken();
  } else {
    console.log("Token de acesso ainda válido.");
  }
  return melhorEnvioToken;
};

// Middleware para fornecer o token de acesso do Melhor Envio
const obterMelhorEnvioToken = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Rota /token chamada para fornecer o token de acesso.");
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    console.error("Erro ao fornecer o token de acesso:", error);
    res.status(500).send("Erro ao obter o token de acesso");
  }
};

// Função para calcular o frete
const calculateShipping = async (req: Request, res: Response) => {
  const { cepOrigem, cepDestino, produtos } = req.body;
  console.log("Iniciando cálculo de frete...");
  console.log("Dados recebidos:", { cepOrigem, cepDestino, produtos });

  try {
    const token = await getAccessToken();
    console.log("Token de acesso obtido:", token);

    // Enviando a requisição POST para a API de cálculo de frete
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/quote`,
      {
        from: { postal_code: cepOrigem },
        to: { postal_code: cepDestino },
        products: produtos,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Resposta da API de cálculo de frete:", response.data);
    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Erro ao calcular frete - resposta da API:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("Erro ao calcular frete - nenhuma resposta recebida da API:", error.request);
    } else {
      console.error("Erro ao calcular frete - configuração da requisição:", error.message);
    }
    res.status(500).send("Erro ao calcular frete");
  }
};



// Definição das rotas
router.get("/calculate", calculateShipping);
router.get("/token", obterMelhorEnvioToken);
router.get("/test", (req: Request, res: Response) => {
  res.send("Rota de teste funcionando.");
});

export default router;
