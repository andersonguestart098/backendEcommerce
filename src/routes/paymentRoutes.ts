// routes/paymentRoutes.ts
import express from "express";
import { createPayment } from "../controllers/paymentController";

const router = express.Router();

// Rota para criar pagamento
router.post("/create-payment", createPayment);

export default router;
