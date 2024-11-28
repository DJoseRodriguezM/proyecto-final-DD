import { Router } from "express";
import { InventarioController } from "../controllers/inventario-controller.js";

const inventarioRouter = Router();

inventarioRouter.post("/restock", InventarioController.restock);
inventarioRouter.get("/:id", InventarioController.getStockyByID);

export default inventarioRouter;