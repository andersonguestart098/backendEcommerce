import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Variáveis para armazenar o token e a validade
let melhorEnvioToken: string = ""; // Inicializado como string vazia
let tokenExpiration: number | null = null;

// Função para obter o token de acesso do Melhor Envio
// Function to get the Melhor Envio access token
const getAccessToken = async (): Promise<string> => {
  // Reuse the token if it exists and is still valid
  if (melhorEnvioToken && tokenExpiration && tokenExpiration > Date.now()) {
    return melhorEnvioToken;
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

    // Save the token and set the expiration time
    melhorEnvioToken = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000; // `expires_in` is in seconds

    console.log("Access Token obtido com sucesso:", melhorEnvioToken);
    return melhorEnvioToken;
  } catch (error: any) {
    // Improved error logging for better debugging
    if (error.response) {
      console.error(
        "Erro na resposta da API:",
        error.response.data || error.response.statusText
      );
    } else if (error.request) {
      console.error("Nenhuma resposta foi recebida da API:", error.request);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }
    throw new Error(
      "Falha ao autenticar na API do Melhor Envio. Tente novamente."
    );
  }
};

// Middleware to provide the Melhor Envio access token
const obterMelhorEnvioToken = async (req: Request, res: Response) => {
  try {
    const token = await getAccessToken();
    res.json({ token });
  } catch (error) {
    console.error("Erro ao fornecer o token de acesso:", error);
    res.status(500).send("Erro ao obter o token de acesso");
  }
};
const calculateShipping = async (req: Request, res: Response) => {
  const { cepDestino, produtos } = req.body;

  if (!cepDestino || !produtos || produtos.length === 0) {
    console.log("Dados incompletos para cálculo de frete.");
    res.status(400).send("CEP de destino e produtos são necessários.");
    return;
  }

  console.log("CEP de destino recebido:", cepDestino);
  console.log(
    "Produtos recebidos para cálculo de frete:",
    JSON.stringify(produtos, null, 2)
  );

  try {
    console.log("Obtendo token de acesso do Melhor Envio...");
    const melhorEnvioToken = await getAccessToken();
    console.log("Token obtido, iniciando cálculo de frete...");

    const filteredProducts = produtos.map((produto: any) => ({
      id: produto.id,
      width: produto.width,
      height: produto.height,
      length: produto.length,
      weight: produto.weight,
      insurance_value: produto.price * produto.quantity,
      quantity: produto.quantity,
    }));

    console.log("Produtos filtrados para a API:", filteredProducts);

    const response = await axios.post(
      "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/shipping/calculate",
      {
        cepDestino: "12345678", // Exemplo de CEP de destino
        produtos: [
          {
            id: "produto1",
            width: 30,
            height: 20,
            length: 40,
            weight: 2,
            price: 50,
            quantity: 1,
          },
          // Outros produtos se necessário
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`, // Corrigido para usar melhorEnvioToken
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Resposta do cálculo de frete:", response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error(
      "Erro ao calcular frete:",
      error.response?.data || error.message
    );
    res.status(500).send("Erro ao calcular frete");
  }
};

// Adicionando funções ao router
router.post("/calculate", calculateShipping);
router.get("/calculate", calculateShipping);
router.get("/token", obterMelhorEnvioToken);

export default router;
