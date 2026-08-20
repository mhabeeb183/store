const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminMiddleware");

const {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  addStockToWarehouse,
  transferStock,
  deleteWarehouse,
  getWarehouseAnalytics,
} = require("../controllers/warehouseController");

router.post("/", protect, adminAuth, createWarehouse);
router.get("/", protect, getAllWarehouses);
router.get("/analytics", protect, adminAuth, getWarehouseAnalytics);
router.get("/:id", protect, getWarehouseById);
router.put("/:id", protect, adminAuth, updateWarehouse);
router.post("/:id/add-stock", protect, addStockToWarehouse);
router.post("/transfer", protect, adminAuth, transferStock);
router.delete("/:id", protect, adminAuth, deleteWarehouse);

module.exports = router;
