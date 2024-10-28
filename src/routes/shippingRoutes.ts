import express, { Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

let melhorEnvioToken: string = "";
let tokenExpiration: number | null = null;

// Função para verificar se o token está expirado
const isTokenExpired = (): boolean => {
  const bufferTime = 5 * 60 * 1000; // 5 minutos de margem
  return !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
};

// Função para obter a URL da API de produção
const getApiUrl = (): string => {
  return "https://www.melhorenvio.com.br";
};

// Função para renovar o token de acesso com logs detalhados
const refreshToken = async (): Promise<void> => {
  try {
    console.log("Iniciando a renovação do token...");

    const response = await axios.post(
      `${getApiUrl()}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.status === 200 && response.data.access_token) {
      melhorEnvioToken = response.data.access_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000;
      console.log("Token atualizado com sucesso:", melhorEnvioToken);
    } else {
      throw new Error("Falha ao obter token de acesso.");
    }
  } catch (error: any) {
    console.error("Erro ao renovar o token:", error.message);
    throw new Error(
      "Erro ao renovar o token. Verifique as credenciais e o ambiente."
    );
  }
};

// Função para obter o token de acesso, com suporte para um token manual de teste
const getAccessToken = async (): Promise<string> => {
  if (process.env.MELHOR_ENVIO_MANUAL_TOKEN) {
    console.log(
      "Usando token manual para teste:",
      process.env.MELHOR_ENVIO_MANUAL_TOKEN
    );
    return process.env.MELHOR_ENVIO_MANUAL_TOKEN;
  }

  console.log("Tentando obter token de acesso...");
  if (!melhorEnvioToken || isTokenExpired()) {
    console.log("Token não encontrado ou expirado. Renovando o token.");
    await refreshToken();
  }
  return melhorEnvioToken;
};

// Função para calcular o frete
const calculateShipping = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Iniciando cálculo de frete...");

    const token = await getAccessToken();
    console.log("Token utilizado para cálculo de frete:", token);

    const { cepOrigem, cepDestino, height, width, length, weight } = req.body;

    if (!cepOrigem || !cepDestino) {
      res.status(400).json({
        error: "Os campos 'cepOrigem' e 'cepDestino' são obrigatórios.",
      });
      return;
    }

    const requestData = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: {
        height: height || 1,
        width: width || 1,
        length: length || 1,
        weight: weight || 0.1,
      },
    };
    console.log("Dados da requisição de frete:", requestData);

    const response = await axios.post(
      `${getApiUrl()}/api/v2/me/shipment/calculate`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "anderson.guestart98@gmail.com",
        },
      }
    );

    console.log("Resposta da API de frete:", response.data);
    res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.error(
        "Erro na resposta da API de cálculo de frete:",
        error.response.data
      );
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error("Erro ao calcular frete:", error.message);
      res.status(500).json({ error: "Erro ao calcular frete." });
    }
  }
};

// Rota para cálculo de frete com autenticação
router.post("/calculate", calculateShipping);

// Rota para verificar o token atual (opcional, para debugging)
router.get("/token", async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    console.error("Erro ao obter o token de acesso:", error);
    res.status(500).send("Erro ao obter o token de acesso");
  }
});

export default router;
