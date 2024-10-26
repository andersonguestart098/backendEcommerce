// shippingRoutes.ts
import express, { Request, Response } from "express";
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
  const bufferTime = 5 * 60 * 1000;
  const isExpired = !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
  console.log(`Token está expirado? ${isExpired}`);
  return isExpired;
};

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
    console.error("Erro ao renovar token:", error.message);
    if (error.response) {
      console.error("Erro na resposta da API:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("Nenhuma resposta recebida da API:", error.request);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }
    throw new Error("Erro ao renovar o token de acesso.");
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

const calculateShipping = async (req: Request, res: Response) => {
  const { cepOrigem, cepDestino, products } = req.body;

  console.log("Iniciando cálculo de frete...");
  console.log("Dados recebidos:", { cepOrigem, cepDestino, products });

  try {
    const token = await getAccessToken();
    console.log("Token de acesso obtido:", token);

    // Criando o corpo da requisição com o formato correto
    const requestBody = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: {
        height: products[0].height,
        width: products[0].width,
        length: products[0].length,
        weight: products[0].weight,
      },
    };

    console.log("Corpo da requisição para cálculo de frete:", requestBody);

    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "Aplicação (email@example.com)"
        }
      }
    );

    console.log("Resposta da API de cálculo de frete:", response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error("Erro ao calcular frete:", error.message);
    if (error.response) {
      console.error("Erro na resposta da API de cálculo de frete:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("Nenhuma resposta recebida da API:", error.request);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }
    res.status(500).send("Erro ao calcular frete");
  }
};

router.post("/calculate", calculateShipping);
router.get("/token", async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    res.status(500).send("Erro ao obter o token de acesso");
  }
});

export default router;
