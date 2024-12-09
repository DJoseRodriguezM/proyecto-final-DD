import { Router } from "express";
import { InventarioController } from "../controllers/inventario-controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js";

const inventarioRouter = Router();

inventarioRouter.post("/restock", authMiddleware, isAdmin, InventarioController.restock);
inventarioRouter.get("/:id", authMiddleware, isAdmin, InventarioController.getStockyByID);

export default inventarioRouter;