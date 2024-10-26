// Arquivo: middleware/melhorEnvioMiddleware.ts
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let melhorEnvioToken: string = "";
let tokenExpiration: number | null = null;

// Função para obter o token de acesso do Melhor Envio
const getAccessToken = async (): Promise<string> => {
  // Verifique se o token está disponível e ainda válido
  if (melhorEnvioToken && tokenExpiration && tokenExpiration > Date.now()) {
    console.log("Token de acesso ainda válido, reutilizando o token existente.");
    return melhorEnvioToken;
  }

  // Verificação adicional das variáveis de ambiente
  if (!process.env.MELHOR_ENVIO_CLIENT_ID || !process.env.MELHOR_ENVIO_SECRET) {
    throw new Error("As credenciais do Melhor Envio não estão definidas no ambiente.");
  }

  try {
    console.log("Iniciando a obtenção do token de acesso...");

    // Envia a requisição para obter o token
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL || "https://api.melhorenvio.com.br"}/oauth/token`,
      new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
        client_secret: process.env.MELHOR_ENVIO_SECRET,
        grant_type: "client_credentials",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    // Processa a resposta
    if (response.status === 200 && response.data.access_token) {
      melhorEnvioToken = response.data.access_token;
      tokenExpiration = Date.now() + response.data.expires_in * 1000;
      console.log("Access Token obtido com sucesso:", melhorEnvioToken);
    } else {
      console.error("Falha ao obter o token de acesso. Status da resposta:", response.status);
      throw new Error("Falha ao obter o token de acesso.");
    }

    return melhorEnvioToken;
  } catch (error: any) {
    if (error.response) {
      console.error("Erro na resposta da API ao obter o token:", error.response.data);
    } else if (error.request) {
      console.error("Nenhuma resposta recebida da API ao obter o token:", error.request);
    } else {
      console.error("Erro ao configurar a requisição para obter o token:", error.message);
    }
    throw new Error("Falha ao autenticar na API do Melhor Envio. Verifique as credenciais.");
  }
};

// Middleware para obter e anexar o token de acesso ao request
const autenticarComMelhorEnvio: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await getAccessToken();
    req.headers.authorization = `Bearer ${token}`;
    next();
  } catch (error) {
    console.error("Erro ao autenticar com Melhor Envio:", error);
    res.status(500).send("Erro ao autenticar com Melhor Envio.");
  }
};

// Middleware opcional para fornecer o token diretamente
const fornecerMelhorEnvioToken: RequestHandler = async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    console.error("Erro ao fornecer o token de acesso:", error);
    res.status(500).send("Erro ao obter o token de acesso");
  }
};

export { getAccessToken, autenticarComMelhorEnvio, fornecerMelhorEnvioToken };
