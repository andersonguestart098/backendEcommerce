import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

console.log("Arquivo shippingRoutes.ts foi carregado.");

let melhorEnvioToken: string = ""; 
let tokenExpiration: number | null = null;

const isTokenExpired = (): boolean => {
  const bufferTime = 5 * 60 * 1000;
  const isExpired = !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
  console.log(`Token está expirado? ${isExpired}`);
  return isExpired;
};

const refreshToken = async (): Promise<void> => {
  try {
    console.log("Iniciando a renovação do token de acesso...");
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
      throw new Error("Falha ao obter o token de acesso.");
    }
  } catch (error: any) {
    console.error("Erro ao renovar token:", error.message);
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

// Função para extrair produtos de cada pacote
const extractProductsFromPackages = (packages: any[]): any[] => {
  return packages.flatMap((pkg) => pkg.products || []);
};

const calculateShipping = async (req: Request, res: Response, next: NextFunction) => {
  const { cepOrigem, cepDestino, packages } = req.body;

  try {
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({ error: "Lista de pacotes inválida ou vazia." });
    }

    // Extraia os produtos de cada pacote
    const products = extractProductsFromPackages(packages);
    if (products.length === 0) {
      return res.status(400).json({ error: "Lista de produtos inválida ou vazia." });
    }

    const token = await getAccessToken();
    console.log("Token de acesso obtido:", token);

    const product = products[0]; // Pega o primeiro produto para o cálculo de frete
    const requestBody = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: {
        height: packages[0].dimensions.height || 1,
        width: packages[0].dimensions.width || 1,
        length: packages[0].dimensions.length || 1,
        weight: packages[0].weight || 0.1,
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
          "User-Agent": "Aplicação anderson.guestart98@gmail.com"
        }
      }
    );
    
    console.log("Resposta da API de cálculo de frete:", response.data);
    return res.json(response.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Erro na resposta da API de cálculo de frete:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("Erro na requisição para a API de cálculo de frete:", error.request);
    } else {
      console.error("Erro ao configurar a requisição de cálculo de frete:", error.message);
    }
    res.status(500).send("Erro ao calcular frete");
    next(error);
  }
};

router.post("/calculate", calculateShipping as express.RequestHandler);
router.get("/token", async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    res.status(500).send("Erro ao obter o token de acesso");
  }
});

export default router;
