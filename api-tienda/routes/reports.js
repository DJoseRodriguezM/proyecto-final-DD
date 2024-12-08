import { Router } from "express";
import { ReportsController } from "../controllers/reports-controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js";

const reportsRouter = Router();

reportsRouter.get('/sales', authMiddleware, isAdmin, ReportsController.sales);
reportsRouter.get('/inventory', authMiddleware, isAdmin, ReportsController.inventory);

export default reportsRouter;