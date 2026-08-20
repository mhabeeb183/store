import Order from "../models/Order.js";
import CartItem from "../models/CartItem.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import RecommendationAnalytics from "../models/recommendationAnalyticsModel.js";
import { processVendorEarnings } from "../utils/vendorEarnings.js";

// Helper to convert product price to float number for calculation
const parsePrice = (priceVal) => {
  if (typeof priceVal === "number") return priceVal;
  if (typeof priceVal === "string") {
    const cleaned = priceVal.replace("RS ", "").trim();
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

// POST - Place a new order and clear user's cart
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, contactNumber, paymentMethod = "Razorpay" } = req.body;

    if (!items || !items.length || !totalAmount || !shippingAddress || !contactNumber) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Wallet Payment validation and deduction
    if (paymentMethod === "Wallet") {
      if ((user.walletBalance || 0) < totalAmount) {
        return res.status(400).json({ message: "Insufficient wallet balance." });
      }
      user.walletBalance -= totalAmount;
      await user.save();
      
      // Credit Admin wallet directly
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + totalAmount;
        await admin.save();
      }
    }

    // Resolve MongoDB ObjectIds, update stocks and track analytics
    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findOne({ id: item.id });
      if (!product) {
        return res.status(404).json({ message: `Product "${item.name}" not found.` });
      }

      if (product.stock < (item.quantity || 1)) {
        return res.status(400).json({ message: `${product.name} is out of stock.` });
      }

      // Deduct inventory
      product.stock -= (item.quantity || 1);
      product.soldCount = (product.soldCount || 0) + (item.quantity || 1);
      await product.save();

      enrichedItems.push({
        id: item.id,
        productId: product._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity || 1,
      });

      // Track analytics click/purchase conversion
      try {
        await RecommendationAnalytics.create({
          user: req.user.id,
          product: product._id,
          category: product.category || "Grocery",
          brand: product.brand || "Fresh",
          action: "purchased",
        });
      } catch (err) {
        console.error("Conversion tracking error:", err.message);
      }
    }

    const order = new Order({
      userId: req.user.id,
      items: enrichedItems,
      totalAmount,
      shippingAddress,
      contactNumber,
      paymentMethod,
      paymentStatus: paymentMethod === "Wallet" ? "Paid" : "Pending",
      orderStatus: "Order Placed",
      statusHistory: [
        {
          status: "Order Placed",
          updatedAt: new Date(),
        },
      ],
    });

    const createdOrder = await order.save();

    // Clear user's cart after successful checkout
    if (!req.body.isBuyNow) {
      await CartItem.deleteMany({ userId: req.user.id });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET - Get all orders (Admin gets all, Vendor gets owned products, User gets their own)
export const getOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === "admin") {
      orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "name email");
    } else if (req.user.role === "vendor") {
      // Find products owned by this vendor
      const vendorProducts = await Product.find({ user: req.user.id });
      const vendorProductIds = vendorProducts.map((p) => p._id.toString());
      const vendorProductCustomIds = vendorProducts.map((p) => p.id);

      const allOrders = await Order.find().sort({ createdAt: -1 }).populate("userId", "name email");
      
      // Filter orders that contain products belonging to this vendor
      orders = allOrders.filter((order) =>
        order.items.some(
          (item) => 
            vendorProductCustomIds.includes(item.id) ||
            (item.productId && vendorProductIds.includes(item.productId.toString()))
        )
      );
    } else {
      orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Role check: Only admin, vendor of items, or order owner can view it
    if (req.user.role !== "admin" && order.userId.toString() !== req.user.id && req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT - Update order status (with live Socket.IO emissions and Delivered cashback triggers)
export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const newStatus = req.body.orderStatus;
    const paymentStatus = req.body.paymentStatus;

    // Role check and status validation
    if (req.user.role === "vendor") {
      const vendorStatuses = ["Packed", "Shipped", "Out For Delivery"];
      if (newStatus && !vendorStatuses.includes(newStatus)) {
        return res.status(403).json({ message: "Vendors can only update statuses to Packed, Shipped, or Out For Delivery." });
      }
    } else if (req.user.role !== "admin") {
      // Customers can only cancel their own order, and only if it is still processing/placed
      if (order.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied." });
      }

      if (newStatus === "Cancelled") {
        if (order.orderStatus !== "Processing" && order.orderStatus !== "Order Placed") {
          return res.status(400).json({ message: `Cannot cancel order that is already ${order.orderStatus}` });
        }
      } else {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    // Apply status updates
    if (newStatus && order.orderStatus !== newStatus) {
      order.orderStatus = newStatus;
      order.statusHistory.push({
        status: newStatus,
        updatedAt: new Date(),
      });

      // Handle order cancellation refund to wallet
      if (newStatus === "Cancelled") {
        order.isCancelled = true;
        order.cancelledAt = new Date();
        order.cancellationReason = req.body.cancellationReason || "Cancelled by customer";
        
        // Restock inventory
        for (const item of order.items) {
          await Product.findOneAndUpdate(
            { id: item.id },
            { $inc: { stock: item.quantity || 1 } }
          );
        }

        // Refund payment to user wallet if paid
        if (order.paymentStatus === "Paid") {
          const user = await User.findById(order.userId);
          if (user) {
            user.walletBalance = (user.walletBalance || 0) + order.totalAmount;
            await user.save();
            
            // Deduct from Admin's wallet balance
            const admin = await User.findOne({ role: "admin" });
            if (admin) {
              admin.walletBalance = Math.max(0, (admin.walletBalance || 0) - order.totalAmount);
              await admin.save();
            }
          }
          order.refundToWallet = true;
          order.refundAmount = order.totalAmount;
          order.paymentStatus = "Failed"; // refunded status
        }
      }

      // Handle delivered triggers: 5% customer cashback & vendor payout split
      if (newStatus === "Delivered" && !order.cashbackGiven) {
        order.paymentStatus = "Paid"; // mark payment complete if not done
        
        // Customer 5% cashback
        const user = await User.findById(order.userId);
        if (user) {
          const cashbackAmount = order.totalAmount * 0.05;
          user.walletBalance = (user.walletBalance || 0) + cashbackAmount;
          await user.save();
          order.cashbackGiven = true;
          console.log(`Credited customer "${user.name}" with 5% cashback: ₹${cashbackAmount}`);
        }

        // Vendor commission splitting
        if (!order.vendorEarningsProcessed) {
          await processVendorEarnings(order);
          order.vendorEarningsProcessed = true;
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (req.body.shippingAddress && req.user.role === "admin") {
      order.shippingAddress = req.body.shippingAddress;
    }
    if (req.body.contactNumber && req.user.role === "admin") {
      order.contactNumber = req.body.contactNumber;
    }

    const updatedOrder = await order.save();

    // Trigger Socket.IO updates to order room
    const io = req.app.get("io");
    if (io) {
      io.to(`order_${order._id}`).emit("orderStatusUpdated", {
        orderId: order._id,
        status: updatedOrder.orderStatus,
        statusHistory: updatedOrder.statusHistory,
        updatedAt: new Date(),
      });
      console.log(`Emitted live socket update for order rooms: order_${order._id} => status: ${updatedOrder.orderStatus}`);
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE - Delete order (Admin only)
export const deleteOrder = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
