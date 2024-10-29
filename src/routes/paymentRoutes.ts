import express from "express";
import { createTransparentPayment } from "../controllers/paymentController";

const router = express.Router();

// Rota para processar o pagamento
router.post("/process_payment", createTransparentPayment);

export default router;
