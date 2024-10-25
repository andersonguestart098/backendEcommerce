import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Função para obter o token de acesso do Melhor Envio
const getAccessToken = async (): Promise<string> => {
  try {
    console.log("Iniciando a obtenção do token de acesso...");
    const response = await axios({
      method: "POST",
      url: `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Verifique se o tipo de conteúdo está correto
      },
      data: new URLSearchParams({
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
        client_secret: process.env.MELHOR_ENVIO_SECRET || "",
        grant_type: "client_credentials",
      }).toString(),
      timeout: 10000, // Timeout de 10 segundos
    });

    if (response.status !== 200 || !response.data.access_token) {
      throw new Error(
        "Falha ao obter o token de acesso. Verifique as credenciais."
      );
    }

    console.log("Access Token obtido com sucesso:", response.data.access_token);
    return response.data.access_token;
  } catch (error: any) {
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

// Endpoint para calcular frete
const calculateShipping = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`,
      {
        from: { postal_code: "CEP_DE_ORIGEM" }, // Substitua pelo CEP real de origem
        to: { postal_code: cepDestino },
        products: produtos.map((produto: any) => ({
          id: produto.id,
          width: produto.width,
          height: produto.height,
          length: produto.length,
          weight: produto.weight,
          insurance_value: produto.price * produto.quantity,
          quantity: produto.quantity,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
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

export default router;
