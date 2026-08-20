import WishlistItem from "../models/WishlistItem.js";

// GET all wishlist items for the logged-in user
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await WishlistItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single wishlist item by ID for the logged-in user
export const getWishlistItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await WishlistItem.findOne({ userId: req.user.id, id });
    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Add or toggle item in wishlist for the logged-in user
export const addToWishlist = async (req, res) => {
  try {
    const product = req.body;
    const exists = await WishlistItem.findOne({ userId: req.user.id, id: product.id });
    
    if (exists) {
      await WishlistItem.deleteOne({ userId: req.user.id, id: product.id });
    } else {
      await WishlistItem.create({
        userId: req.user.id,
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }
    
    const updatedWishlist = await WishlistItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT - Update wishlist item by ID for the logged-in user
export const updateWishlistItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, price, image } = req.body;

    const updatedItem = await WishlistItem.findOneAndUpdate(
      { userId: req.user.id, id },
      { name, price, image },
      { returnDocument: "after" }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    const updatedWishlist = await WishlistItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE - Remove item from wishlist by ID for the logged-in user
export const deleteWishlistItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deletedItem = await WishlistItem.findOneAndDelete({ userId: req.user.id, id });

    if (!deletedItem) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    const updatedWishlist = await WishlistItem.find({ userId: req.user.id }).sort({ id: 1 });
    res.status(200).json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
