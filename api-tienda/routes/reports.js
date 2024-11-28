import { Router } from "express";
import { ReportsController } from "../controllers/reports-controller.js";

const reportsRouter = Router();

reportsRouter.get("/sales", ReportsController.sales);
reportsRouter.get("/inventory", ReportsController.inventory);

export default reportsRouter;