"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const melhorEnvioMiddleware_1 = require("../middleware/melhorEnvioMiddleware");
dotenv_1.default.config();
const router = express_1.default.Router();
console.log("Arquivo shippingRoutes.ts foi carregado.");
let melhorEnvioToken = "";
let tokenExpiration = null;
// Função para verificar se o token está expirado
const isTokenExpired = () => {
    const bufferTime = 5 * 60 * 1000; // 5 minutos de margem
    const isExpired = !tokenExpiration || Date.now() + bufferTime >= tokenExpiration;
    console.log(`Token está expirado? ${isExpired}`);
    return isExpired;
};
// Função para obter a URL da API com base no ambiente
const getApiUrl = () => {
    return process.env.MELHOR_ENVIO_ENV === "production"
        ? "https://api.melhorenvio.com.br"
        : "https://sandbox.melhorenvio.com.br";
};
// Função para renovar o token de acesso
const refreshToken = async () => {
    try {
        console.log("Renovando o token...");
        const apiUrl = getApiUrl();
        const response = await axios_1.default.post(`${apiUrl}/oauth/token`, new URLSearchParams({
            client_id: process.env.MELHOR_ENVIO_CLIENT_ID || "",
            client_secret: process.env.MELHOR_ENVIO_SECRET || "",
            grant_type: "client_credentials",
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (response.status === 200 && response.data.access_token) {
            melhorEnvioToken = response.data.access_token;
            tokenExpiration = Date.now() + response.data.expires_in * 1000;
            console.log("Token atualizado:", melhorEnvioToken);
        }
        else {
            throw new Error("Falha ao obter token de acesso.");
        }
    }
    catch (error) {
        console.error("Erro ao renovar o token:", error.message);
        throw new Error("Erro ao renovar o token. Verifique as credenciais e o ambiente.");
    }
};
// Função para obter o token de acesso, renovando-o se necessário
const getAccessToken = async () => {
    console.log("Obtendo token de acesso...");
    if (!melhorEnvioToken || isTokenExpired()) {
        console.log("Token não encontrado ou expirado, renovando token...");
        await refreshToken();
    }
    else {
        console.log("Token de acesso ainda válido.");
    }
    return melhorEnvioToken;
};
// Função para calcular o frete
const calculateShipping = async (req, res) => {
    try {
        const token = await getAccessToken();
        console.log("Token obtido para requisição:", token);
        const apiUrl = getApiUrl();
        const response = await axios_1.default.post(`${apiUrl}/api/v2/me/shipment/calculate`, {
            from: { postal_code: req.body.cepOrigem },
            to: { postal_code: req.body.cepDestino },
            package: {
                height: req.body.height || 1,
                width: req.body.width || 1,
                length: req.body.length || 1,
                weight: req.body.weight || 0.1,
            },
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "User-Agent": "Aplicação anderson.guestart98@gmail.com",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        if (error.response) {
            console.error("Erro na resposta da API de cálculo de frete:", error.response.data);
            res.status(error.response.status).json(error.response.data);
        }
        else {
            console.error("Erro ao calcular frete:", error.message);
            res.status(500).json({ error: "Erro ao calcular frete." });
        }
    }
};
// Rota para cálculo de frete com autenticação
router.post("/calculate", melhorEnvioMiddleware_1.autenticarComMelhorEnvio, calculateShipping);
// Rota para verificar o token atual (opcional, para debugging)
router.get("/token", async (req, res) => {
    try {
        const token = await getAccessToken();
        res.json({ token });
    }
    catch (error) {
        console.error("Erro ao obter o token de acesso:", error);
        res.status(500).send("Erro ao obter o token de acesso");
    }
});
exports.default = router;
