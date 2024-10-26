import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController";

console.log(handleMercadoPagoWebhook); // Deve exibir a função se a importação estiver correta.

const router = express.Router();

router.post("/webhook/mercado-pago", handleMercadoPagoWebhook);

export default router;
