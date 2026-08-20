const Warehouse = require("../models/Warehouse");
const Product = require("../models/Product");

// Create a new warehouse
const createWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all warehouses
const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({})
      .populate("manager", "name email")
      .populate("products.product", "name price images");

    res.json({ success: true, warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get warehouse by ID
const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id)
      .populate("manager", "name email")
      .populate("products.product", "name price stock images");

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    res.json({ success: true, warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update warehouse
const updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    res.json({ success: true, warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add product stock to warehouse
const addStockToWarehouse = async (req, res) => {
  try {
    const { productId, quantity, bin } = req.body;
    const warehouse = await Warehouse.findById(req.params.id);

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const existingProduct = warehouse.products.find(
      (p) => p.product.toString() === productId
    );

    if (existingProduct) {
      existingProduct.quantity += quantity;
      if (bin) existingProduct.bin = bin;
    } else {
      warehouse.products.push({ product: productId, quantity, bin: bin || "A1" });
    }

    warehouse.currentStock = warehouse.products.reduce(
      (sum, p) => sum + p.quantity,
      0
    );

    await warehouse.save();

    // Update product stock as well
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: quantity },
      warehouseLocation: warehouse.name,
    });

    res.json({ success: true, warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Transfer stock between warehouses
const transferStock = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity } = req.body;

    const fromWarehouse = await Warehouse.findById(fromWarehouseId);
    const toWarehouse = await Warehouse.findById(toWarehouseId);

    if (!fromWarehouse || !toWarehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const fromProduct = fromWarehouse.products.find(
      (p) => p.product.toString() === productId
    );

    if (!fromProduct || fromProduct.quantity < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    fromProduct.quantity -= quantity;

    const toProduct = toWarehouse.products.find(
      (p) => p.product.toString() === productId
    );

    if (toProduct) {
      toProduct.quantity += quantity;
    } else {
      toWarehouse.products.push({ product: productId, quantity });
    }

    fromWarehouse.currentStock = fromWarehouse.products.reduce(
      (sum, p) => sum + p.quantity, 0
    );
    toWarehouse.currentStock = toWarehouse.products.reduce(
      (sum, p) => sum + p.quantity, 0
    );

    await fromWarehouse.save();
    await toWarehouse.save();

    res.json({
      success: true,
      message: `Transferred ${quantity} units successfully`,
      fromWarehouse,
      toWarehouse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete warehouse
const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    res.json({ success: true, message: "Warehouse deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get warehouse analytics
const getWarehouseAnalytics = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({});

    const totalWarehouses = warehouses.length;
    const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacity, 0);
    const totalCurrentStock = warehouses.reduce((sum, w) => sum + w.currentStock, 0);
    const utilizationRate = totalCapacity > 0
      ? ((totalCurrentStock / totalCapacity) * 100).toFixed(2)
      : 0;

    const activeWarehouses = warehouses.filter((w) => w.status === "active").length;

    res.json({
      success: true,
      analytics: {
        totalWarehouses,
        activeWarehouses,
        totalCapacity,
        totalCurrentStock,
        utilizationRate: `${utilizationRate}%`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  updateWarehouse,
  addStockToWarehouse,
  transferStock,
  deleteWarehouse,
  getWarehouseAnalytics,
};
