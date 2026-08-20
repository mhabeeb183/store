import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import CartItem from "../models/CartItem.js";
import WishlistItem from "../models/WishlistItem.js";

const router = express.Router();

// Health check endpoint for MongoDB connection
router.get("/db-status", (req, res) => {
  const state = mongoose.connection.readyState;
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.json({
    status: states[state] || "Unknown",
    readyState: state,
    isConnected: state === 1,
    databaseName: mongoose.connection.name || "N/A",
    host: mongoose.connection.host || "N/A",
  });
});

const initialProducts = [
  {
    id: 1,
    name: "Fresh Tomatoes",
    price: "RS 200",
    image: "https://images.unsplash.com/photo-1524593166156-312f362cada0",
  },
  {
    id: 2,
    name: "Organic Carrots",
    price: "RS 1.99",
    image: "https://images.unsplash.com/photo-1447175008436-054170c2e979",
  },
  {
    id: 3,
    name: "Farm Eggs (Dozen)",
    price: "RS 399",
    image: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7",
  },
  {
    id: 4,
    name: "Green Spinach",
    price: "RS 229",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb",
  },
  {
    id: 5,
    name: "Broccoli",
    price: "RS 279",
    image: "https://images.unsplash.com/photo-1584270354949-1b26d0bafe72",
  },
  {
    id: 6,
    name: "Red Onions",
    price: "RS 149",
    image: "https://images.unsplash.com/photo-1508747703725-719777637510",
  },
  {
    id: 7,
    name: "Bell Peppers",
    price: "RS 299",
    image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83",
  },
  {
    id: 8,
    name: "Potatoes (1kg)",
    price: "RS 179",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
  },
];

// --- PRODUCTS ---
router.get("/products", async (req, res) => {
  try {
    let products = await Product.find().sort({ id: 1 });
    if (products.length === 0) {
      products = await Product.insertMany(initialProducts);
    }
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- CART ---
router.get("/cart", async (req, res) => {
  try {
    const cart = await CartItem.find().sort({ id: 1 });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/cart", async (req, res) => {
  try {
    const product = req.body;
    let item = await CartItem.findOne({ id: product.id });
    if (item) {
      item.quantity += 1;
      await item.save();
    } else {
      await CartItem.create({ ...product, quantity: 1 });
    }
    const updatedCart = await CartItem.find().sort({ id: 1 });
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/cart/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { change } = req.body;
    let item = await CartItem.findOne({ id });
    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        await CartItem.deleteOne({ id });
      } else {
        await item.save();
      }
    }
    const updatedCart = await CartItem.find().sort({ id: 1 });
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/cart/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await CartItem.deleteOne({ id });
    const updatedCart = await CartItem.find().sort({ id: 1 });
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- WISHLIST ---
router.get("/wishlist", async (req, res) => {
  try {
    const wishlist = await WishlistItem.find().sort({ id: 1 });
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/wishlist", async (req, res) => {
  try {
    const product = req.body;
    const exists = await WishlistItem.findOne({ id: product.id });
    if (exists) {
      await WishlistItem.deleteOne({ id: product.id });
    } else {
      await WishlistItem.create({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
    const updatedWishlist = await WishlistItem.find().sort({ id: 1 });
    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/wishlist/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await WishlistItem.deleteOne({ id });
    const updatedWishlist = await WishlistItem.find().sort({ id: 1 });
    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
