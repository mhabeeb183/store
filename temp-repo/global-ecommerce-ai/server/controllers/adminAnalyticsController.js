const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const getAdminAnalytics = async (req, res) => {
  try {
    // Basic Counts
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Fetch All Orders
    const orders = await Order.find();

    // Total Revenue
    const totalRevenue = orders.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );

    // Order Status Counts
    const pendingOrders = orders.filter(
      (order) => ["Order Placed", "Packed"].includes(order.orderStatus)
    ).length;

    const shippedOrders = orders.filter(
      (order) => ["Shipped", "Out For Delivery"].includes(order.orderStatus)
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.orderStatus === "Delivered"
    ).length;

    // Recent Orders
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly Revenue
    const monthlyRevenue = [
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 0 },
      { month: "Mar", revenue: 0 },
      { month: "Apr", revenue: 0 },
      { month: "May", revenue: 0 },
      { month: "Jun", revenue: 0 },
      { month: "Jul", revenue: 0 },
      { month: "Aug", revenue: 0 },
      { month: "Sep", revenue: 0 },
      { month: "Oct", revenue: 0 },
      { month: "Nov", revenue: 0 },
      { month: "Dec", revenue: 0 },
    ];

    orders.forEach((order) => {
      const monthIndex = new Date(
        order.createdAt
      ).getMonth();

      monthlyRevenue[monthIndex].revenue +=
        order.totalPrice;
    });

    res.status(200).json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,

      pendingOrders,
      shippedOrders,
      deliveredOrders,

      recentOrders,
      monthlyRevenue,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch analytics",
    });
  }
};

module.exports = {
  getAdminAnalytics,
};