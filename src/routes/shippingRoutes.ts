import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const getAccessToken = async () => {
  try {
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      {
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
        client_secret: process.env.MELHOR_ENVIO_SECRET,
        grant_type: "client_credentials",
      }
    );
    console.log("Access Token:", response.data.access_token);
    return response.data.access_token;
  } catch (error: any) {
    console.error(
      "Erro ao obter access token:",
      error.response?.data || error.message
    );
    throw new Error("Falha ao autenticar");
  }
};

// Endpoint para calcular frete
router.post("/calculate", async (req, res) => {
  const { cepDestino, produtos } = req.body;

  try {
    // Obtenha o token antes de fazer a requisição
    const melhorEnvioToken = await getAccessToken();

    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`,
      {
        from: { postal_code: "CEP_DE_ORIGEM" },
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

    res.json(response.data);
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    res.status(500).send("Erro ao calcular frete");
  }
});

router.get("/callback", async (req, res) => {
  const authorizationCode = req.query.code;
  // Troca o código de autorização pelo token de acesso
  try {
    const response = await axios.post(
      `${process.env.MELHOR_ENVIO_API_URL}/oauth/token`,
      {
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
        client_secret: process.env.MELHOR_ENVIO_SECRET,
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri:
          "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/callback",
      }
    );

    // Armazena o token e redireciona conforme necessário
    res.json(response.data);
  } catch (error) {
    console.error("Erro no callback:", error);
    res.status(500).send("Erro ao processar autorização");
  }
});

export default router;
