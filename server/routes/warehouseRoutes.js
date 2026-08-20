import express from "express";
import { 
  createWarehouse, 
  getAllWarehouses, 
  getWarehouseById, 
  updateWarehouse, 
  addStockToWarehouse, 
  transferStock, 
  deleteWarehouse, 
  getWarehouseAnalytics 
} from "../controllers/warehouseController.js";
import UserAuth from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(UserAuth);

// Admin controls
router.get("/analytics", getWarehouseAnalytics);
router.post("/", createWarehouse);
router.get("/", getAllWarehouses);
router.get("/:id", getWarehouseById);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

// Stock allocations
router.post("/:id/add-stock", addStockToWarehouse);
router.post("/transfer", transferStock);

export default router;
