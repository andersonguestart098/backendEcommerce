// routes/paymentRoutes.ts
import express from "express";
import { createTransparentPayment } from "../controllers/paymentController";

const router = express.Router();

// Rota para criar pagamento
router.post("/create-payment", createTransparentPayment);

export default router;
