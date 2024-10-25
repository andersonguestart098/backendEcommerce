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
exports.obterMelhorEnvioToken = exports.getAccessToken = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let melhorEnvioToken = ""; // Inicialize como string vazia
let tokenExpiration = null;
// Função para obter o token de acesso do Melhor Envio
const getAccessToken = () => __awaiter(void 0, void 0, void 0, function* () {
    if (melhorEnvioToken && tokenExpiration && tokenExpiration > Date.now()) {
        return melhorEnvioToken; // Se o token ainda for válido, reutilize-o
    }
    try {
        console.log("Iniciando a obtenção do token de acesso...");
        const response = yield (0, axios_1.default)({
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
            throw new Error("Falha ao obter o token de acesso. Verifique as credenciais.");
        }
        melhorEnvioToken = response.data.access_token;
        tokenExpiration = Date.now() + response.data.expires_in * 1000; // Assumindo que `expires_in` é dado em segundos
        console.log("Access Token obtido com sucesso:", melhorEnvioToken);
        return melhorEnvioToken;
    }
    catch (error) {
        console.error("Erro ao obter token de acesso:", error);
        throw new Error("Falha ao autenticar na API do Melhor Envio. Tente novamente.");
    }
});
exports.getAccessToken = getAccessToken;
// Middleware para fornecer o token de acesso
const obterMelhorEnvioToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = yield getAccessToken();
        res.json({ token });
    }
    catch (error) {
        res.status(500).send("Erro ao obter o token de acesso");
    }
});
exports.obterMelhorEnvioToken = obterMelhorEnvioToken;
