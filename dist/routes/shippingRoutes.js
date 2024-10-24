"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const getAccessToken = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield axios_1.default.post(`${process.env.MELHOR_ENVIO_API_URL}/oauth/token`, {
            client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
            client_secret: process.env.MELHOR_ENVIO_SECRET,
            grant_type: "client_credentials",
        });
        console.log("Access Token:", response.data.access_token);
        return response.data.access_token;
    }
    catch (error) {
        console.error("Erro ao obter access token:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error("Falha ao autenticar");
    }
});
// Endpoint para calcular frete
router.post("/calculate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { cepDestino, produtos } = req.body;
    try {
        // Obtenha o token antes de fazer a requisição
        const melhorEnvioToken = yield getAccessToken();
        const response = yield axios_1.default.post(`${process.env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`, {
            from: { postal_code: "CEP_DE_ORIGEM" },
            to: { postal_code: cepDestino },
            products: produtos.map((produto) => ({
                id: produto.id,
                width: produto.width,
                height: produto.height,
                length: produto.length,
                weight: produto.weight,
                insurance_value: produto.price * produto.quantity,
                quantity: produto.quantity,
            })),
        }, {
            headers: {
                Authorization: `Bearer ${melhorEnvioToken}`,
                "Content-Type": "application/json",
            },
        });
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro ao calcular frete:", error);
        res.status(500).send("Erro ao calcular frete");
    }
}));
router.get("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authorizationCode = req.query.code;
    // Troca o código de autorização pelo token de acesso
    try {
        const response = yield axios_1.default.post(`${process.env.MELHOR_ENVIO_API_URL}/oauth/token`, {
            client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
            client_secret: process.env.MELHOR_ENVIO_SECRET,
            grant_type: "authorization_code",
            code: authorizationCode,
            redirect_uri: "https://ecommerce-fagundes-13c7f6f3f0d3.herokuapp.com/callback",
        });
        // Armazena o token e redireciona conforme necessário
        res.json(response.data);
    }
    catch (error) {
        console.error("Erro no callback:", error);
        res.status(500).send("Erro ao processar autorização");
    }
}));
exports.default = router;
