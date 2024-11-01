import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController";

const router = express.Router();
router.post("/mercado-pago/webhook", handleMercadoPagoWebhook);

export default router;
