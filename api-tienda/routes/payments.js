import { Router } from "express";
import { PaymentsController } from "../controllers/payments-controller.js";

const paymentsRouter = Router();

paymentsRouter.post("/checkout", PaymentsController.checkout);
paymentsRouter.get("/history/:userId", PaymentsController.history);

export default paymentsRouter;