import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import { getRedisClient, isRedisConnected } from "../config/redis.js";

const clearProductCache = async (id) => {
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      await redis.del("all_products");
      if (id) {
        await redis.del(`product_${id}`);
      }
    } catch (err) {
      console.warn("Failed to invalidate Redis cache:", err.message);
    }
  }
};

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "freshcart_products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

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
  {
    id: 9,
    name: "Maggi Noodles",
    price: "RS 99",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce",
  },
  {
    id: 10,
    name: "Black Pepper Powder (100g)",
    price: "RS 149",
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32",
  },
  {
    id: 11,
    name: "Organic Milk (1L)",
    price: "RS 85",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150",
  },
  {
    id: 12,
    name: "Whole Wheat Bread",
    price: "RS 50",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff",
  },
  {
    id: 13,
    name: "Salted Butter (200g)",
    price: "RS 120",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d",
  },
  {
    id: 14,
    name: "Assam Tea Leaves (250g)",
    price: "RS 180",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12",
  },
];

// GET all products
export const getAllProducts = async (req, res) => {
  try {
    const isCacheActive = isRedisConnected();
    const redis = getRedisClient();

    if (isCacheActive) {
      try {
        const cached = await redis.get("all_products");
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      } catch (err) {
        console.warn("Redis read error:", err.message);
      }
    }

    let products = await Product.find().sort({ id: 1 });
    if (products.length < initialProducts.length) {
      const existingIds = products.map(p => p.id);
      const missingProducts = initialProducts.filter(p => !existingIds.includes(p.id));
      if (missingProducts.length > 0) {
        await Product.insertMany(missingProducts);
        products = await Product.find().sort({ id: 1 });
      }
    }

    if (isCacheActive) {
      try {
        await redis.set("all_products", JSON.stringify(products), { EX: 3600 }); // cache for 1 hour
      } catch (err) {
        console.warn("Redis write error:", err.message);
      }
    }

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single product by ID
export const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const isCacheActive = isRedisConnected();
    const redis = getRedisClient();

    if (isCacheActive) {
      try {
        const cached = await redis.get(`product_${id}`);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      } catch (err) {
        console.warn("Redis read error:", err.message);
      }
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (isCacheActive) {
      try {
        await redis.set(`product_${id}`, JSON.stringify(product), { EX: 3600 });
      } catch (err) {
        console.warn("Redis write error:", err.message);
      }
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Create a new product
export const createProduct = async (req, res) => {
  try {
    let { id, name, price, image } = req.body;

    // Upload to Cloudinary if file is provided via multer
    if (req.file) {
      try {
        image = await uploadToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        return res.status(500).json({ message: "Cloudinary upload failed: " + uploadErr.message });
      }
    }
    
    // Auto increment ID if not provided
    let newId = id;
    if (!newId) {
      const lastProduct = await Product.findOne().sort({ id: -1 });
      newId = lastProduct ? lastProduct.id + 1 : 1;
    }

    const newProduct = await Product.create({
      id: newId,
      name,
      price,
      image,
    });

    await clearProductCache();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT - Update a product by ID
export const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    let { name, price, image } = req.body;

    // Upload to Cloudinary if file is provided via multer
    if (req.file) {
      try {
        image = await uploadToCloudinary(req.file.buffer);
      } catch (uploadErr) {
        return res.status(500).json({ message: "Cloudinary upload failed: " + uploadErr.message });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { id },
      { name, price, image },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await clearProductCache(id);
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE - Delete a product by ID
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deletedProduct = await Product.findOneAndDelete({ id });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    await clearProductCache(id);
    res.status(200).json({ message: "Product deleted successfully", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
