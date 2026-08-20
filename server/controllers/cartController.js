import CartItem from "../models/CartItem.js";

// GET all cart items for the logged-in user
export const getCart = async (req, res) => {
  try {
    const cart = await CartItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single cart item by ID for the logged-in user
export const getCartItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CartItem.findOne({ userId: req.user.id, id });
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Add item to logged-in user's cart
export const addToCart = async (req, res) => {
  try {
    const product = req.body;
    let item = await CartItem.findOne({ userId: req.user.id, id: product.id });
    
    if (item) {
      item.quantity += 1;
      await item.save();
    } else {
      // Create new cart item linked to this user, omitting database internal _id if passed from body
      const { _id, ...productData } = product;
      await CartItem.create({ ...productData, quantity: 1, userId: req.user.id });
    }
    
    const updatedCart = await CartItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({ message: error.message });
  }
};

// PUT - Update cart item by ID for the logged-in user
export const updateCartItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { change, quantity } = req.body;
    let item = await CartItem.findOne({ userId: req.user.id, id });

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (quantity !== undefined) {
      item.quantity = quantity;
    } else if (change !== undefined) {
      item.quantity += change;
    }

    if (item.quantity <= 0) {
      await CartItem.deleteOne({ userId: req.user.id, id });
    } else {
      await item.save();
    }

    const updatedCart = await CartItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE - Remove cart item by ID for the logged-in user
export const deleteCartItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deletedItem = await CartItem.findOneAndDelete({ userId: req.user.id, id });

    if (!deletedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const updatedCart = await CartItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
