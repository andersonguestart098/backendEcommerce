"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhookController_1 = require("../controllers/webhookController");
console.log(webhookController_1.handleMercadoPagoWebhook); // Deve exibir a função se a importação estiver correta.
const router = express_1.default.Router();
router.post("/webhook/mercado-pago", webhookController_1.handleMercadoPagoWebhook);
exports.default = router;
