import { Router } from "express";
import { PaymentsController } from "../controllers/payments-controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const paymentsRouter = Router();

paymentsRouter.post("/checkout", authMiddleware, PaymentsController.checkout);
paymentsRouter.get("/history/:userId", authMiddleware, PaymentsController.history);

export default paymentsRouter;