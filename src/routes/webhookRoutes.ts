import express from "express";
import { handleMercadoPagoWebhook } from "../controllers/webhookController";

const router = express.Router();

// Define the Mercado Pago webhook route
router.post("/mercado-pago/webhook", handleMercadoPagoWebhook);

export default router;
