import express, { Request, Response, NextFunction } from "express";
import { createTransparentPayment } from "../controllers/paymentController";

const router = express.Router();

// Middleware de log específico para esta rota
router.post("/process_payment", (req: Request, res: Response, next: NextFunction) => {
  console.log("Rota /process_payment chamada");
  console.log("Corpo da requisição:", req.body);
  next(); // Passa para o próximo middleware/controller
}, createTransparentPayment);

export default router;
