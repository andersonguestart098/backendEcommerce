import express, { Request, Response, NextFunction } from "express";
import { createTransparentPayment } from "../controllers/paymentController";

const router = express.Router();

router.post("/process_payment", createTransparentPayment);


export default router;
