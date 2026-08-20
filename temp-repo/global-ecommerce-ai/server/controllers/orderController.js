
const Order = require("../models/Order");
const Coupon = require(
  "../models/couponModel"
);
const User = require("../models/User");
const {
  calculateDynamicPrice,
} = require("../services/dynamicPricingService");

const {
  processVendorEarnings,
} = require("../utils/vendorEarnings");
const Product = require("../models/Product");
const RecommendationAnalytics = require(
  "../models/recommendationAnalyticsModel"
);
const Affiliate = require(
  "../models/affiliateModel"
);
//
// CREATE ORDER
//
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      totalPrice,
      isPaid,
      paidPrice,
      couponCode,
      discount,
      affiliateCode,
      shippingDetails,
      paymentMethod,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    // Validate inventory and calculate verified total price from DB
    let calculatedTotalPrice = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: `Product not found`,
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      const itemPrice = product.dynamicPrice || product.price;
      calculatedTotalPrice += itemPrice * item.qty;
      item.price = itemPrice; // Ensure DB price is set in the item
    }

    const dbUser = await User.findById(req.user._id);
    const hasActiveSubscription = !!(dbUser && dbUser.isSubscribed && dbUser.subscriptionExpiry && new Date(dbUser.subscriptionExpiry) > new Date());
    const deliveryCharge = hasActiveSubscription ? 0 : 70;

    // Validate Coupon if provided
    let calculatedDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon && !coupon.isUsed && new Date() <= coupon.expiryDate) {
        if (calculatedTotalPrice >= coupon.minOrderAmount) {
          if (coupon.discountType === "fixed") {
            calculatedDiscount = coupon.discountValue;
          } else {
            calculatedDiscount = (calculatedTotalPrice * coupon.discountValue) / 100;
          }
        }
      }
    }

    const finalTotalPrice = Math.max(0, calculatedTotalPrice - calculatedDiscount + deliveryCharge);

    const order = new Order({
      user: req.user._id,

      orderItems,

      totalPrice: finalTotalPrice,

      discount: calculatedDiscount,

      deliveryCharge,

      isPaid: isPaid || false,

      paidPrice: isPaid ? finalTotalPrice : 0,

      paidAt: isPaid
        ? Date.now()
        : null,

      shippingDetails: shippingDetails || {},

      paymentMethod: paymentMethod || "Razorpay",

      //
      // ORDER TRACKING
      //
      orderStatus: "Order Placed",

      statusHistory: [
        {
          status: "Order Placed",
          updatedAt: new Date(),
        },
      ],
    });
 //
// REDUCE INVENTORY
//
for (const item of orderItems) {
  const product =
    await Product.findById(
      item.product
    );

  product.stock -= item.qty;

  product.soldCount += item.qty;

  await product.save();

  // RECALCULATE DYNAMIC PRICE
  await calculateDynamicPrice(
    product._id
  );
}
    const createdOrder =
      await order.save();

    // Credit Admin Wallet for paid Razorpay orders
    if (createdOrder.isPaid && createdOrder.paymentMethod === "Razorpay") {
      const admin = await User.findOne({ role: "admin" });
      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + createdOrder.totalPrice;
        await admin.save();
        console.log(`Razorpay Payment: Credited Admin "${admin.name}" wallet with ₹${createdOrder.totalPrice}`);
      }
    }

   
const affiliate =
  await Affiliate.findOne({
    referredUser: req.user._id,
  });

if (
  affiliate &&
  !affiliate.rewardGiven
) {
  const couponCode =
    "REF200" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  await Coupon.create({
    code: couponCode,
    user: affiliate.affiliateUser,
    discountType: "fixed",
    discountValue: 200,
    minOrderAmount: 1000,
    expiryDate: new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000
    ),
    reason: "Referral Reward",
  });

  affiliate.rewardGiven = true;
  affiliate.firstOrderCompleted = true;
  affiliate.order = createdOrder._id;

  await affiliate.save();

  console.log(
    "Referral Coupon Created:",
    couponCode
  );
}
      //
      // AFFILIATE COMMISSION
      //
      let targetAffiliateCode = affiliateCode;
      if (!targetAffiliateCode) {
        try {
          const userAffiliate = await Affiliate.findOne({
            referredUser: req.user._id,
            isConverted: false,
          });
          if (userAffiliate) {
            targetAffiliateCode = userAffiliate.affiliateCode;
          }
        } catch (err) {
          console.log("Error looking up referred user affiliate:", err.message);
        }
      }

      if (targetAffiliateCode) {
        try {
          const affiliate = await Affiliate.findOne({
            affiliateCode: targetAffiliateCode,
          });

          if (
            affiliate &&
            !affiliate.isConverted
          ) {
            affiliate.order =
              createdOrder._id;

            affiliate.orderAmount =
              totalPrice;

            affiliate.commissionEarned =
              (totalPrice *
                affiliate.commissionRate) /
              100;

            affiliate.isConverted =
              true;

            affiliate.convertedAt =
              new Date();

            affiliate.referredUser =
              req.user._id;

            await affiliate.save();

            console.log(
              "Affiliate Commission Added"
            );
          }
        } catch (error) {
          console.log(
            "Affiliate Error:",
            error.message
          );
        }
      }
  //
// MARK COUPON USED
//
if (couponCode) {
  const coupon =
    await Coupon.findOne({
      code: couponCode,
    });

  if (
    coupon &&
    !coupon.isUsed
  ) {
    coupon.isUsed = true;

    coupon.usedAt =
      new Date();

    await coupon.save();
  }
}
      try {
  for (const item of orderItems) {
    const product =
      await Product.findById(
        item.product
      );

    if (product) {
      await RecommendationAnalytics.create({
        user: req.user._id,
        product: product._id,
        category: product.category,
        brand: product.brand,
        action: "purchased",
      });
    }
  }
} catch (trackingError) {
  console.error(
    "Purchase Tracking Error:",
    trackingError.message
  );
}

    res.status(201).json(
      createdOrder
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//
// GET MY ORDERS
//
const getMyOrders = async (
  req,
  res
) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      }).sort({
      createdAt: -1,
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//
// GET VENDOR ORDERS
//
const getVendorOrders =
  async (req, res) => {
    try {
      const Product = require(
        "../models/Product"
      );

      const vendorProducts =
        await Product.find({
          user: req.user._id,
        });

      const productIds =
        vendorProducts.map((product) =>
          product._id.toString()
        );

      const orders =
        await Order.find().populate(
          "user",
          "name email"
        );

      const vendorOrders =
        orders.filter((order) =>
          order.orderItems.some(
            (item) =>
              item.product &&
              productIds.includes(
                item.product.toString()
              )
          )
        );

      res
        .status(200)
        .json(vendorOrders);
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

//
// GET ALL ORDERS (ADMIN)
//
const getAllOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await Order.find().populate(
        "user",
        "name email"
      );

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//
// UPDATE ORDER STATUS
//
const updateOrderStatus =
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res
          .status(404)
          .json({
            message:
              "Order not found",
          });
      }

      const newStatus =
        req.body.status;

        //
// ROLE-BASED STATUS CONTROL
//
if (
  req.user.role === "vendor"
) {
  const vendorStatuses = [
    "Packed",
    "Shipped",
    "Out For Delivery",
  ];

  if (
    !vendorStatuses.includes(
      newStatus
    )
  ) {
    return res.status(403).json({
      message:
        "Vendors cannot set this status",
    });
  }
}

if (
  req.user.role === "admin"
) {
  if (
    newStatus !== "Delivered"
  ) {
    return res.status(403).json({
      message:
        "Admins can only mark Delivered",
    });
  }
}

      const validStatuses = [
        "Order Placed",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
      ];

      if (
        !validStatuses.includes(
          newStatus
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid order status",
          });
      }

 if (order.orderStatus === newStatus) {
  return res.status(400).json({
    message: "Order already has this status",
  });
}

order.orderStatus = newStatus;

order.statusHistory.push({
  status: newStatus,
  updatedAt: new Date(),
});

      //
      // CUSTOMER CASHBACK
      //
      if (
        newStatus ===
          "Delivered" &&
        order.isPaid &&
        !order.cashbackGiven
      ) {
        const user =
          await User.findById(
            order.user
          );

        if (user) {
          const cashback =
            order.totalPrice * 0.05;

          user.walletBalance =
            (user.walletBalance ||
              0) + cashback;

          await user.save();

          order.cashbackGiven = true;
        }
      }

      //
      // VENDOR EARNINGS
      //
      if (
        newStatus ===
          "Delivered" &&
        order.isPaid &&
        !order.vendorEarningsProcessed
      ) {
        await processVendorEarnings(
          order
        );

        order.vendorEarningsProcessed =
          true;
      }

      const updatedOrder =
        await order.save();

      //
      // SOCKET.IO REAL-TIME EVENT
      //
      const io =
        req.app.get("io");

      if (io) {
        io.to(
          `order_${order._id}`
        ).emit(
          "orderStatusUpdated",
          {
            orderId:
              order._id,
            status:
              updatedOrder.orderStatus,
            statusHistory:
              updatedOrder.statusHistory,
            updatedAt:
              new Date(),
          }
        );
      }

      res.status(200).json({
        message:
          "Order status updated successfully",
        order: updatedOrder,
      });
    } catch (error) {
      console.error(
      "Update Order Status Error:",
      error
      );

      res.status(500).json({
        message: error.message,
      });
    }
  };

//
// MARK ORDER AS PAID
//
const markOrderPaid =
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res
          .status(404)
          .json({
            message:
              "Order not found",
          });
      }

      order.isPaid = true;
      order.paidAt = Date.now();

      const updatedOrder =
        await order.save();

      // Credit Admin Wallet if paid price was not via Wallet
      if (updatedOrder.paymentMethod !== "Wallet") {
        const admin = await User.findOne({ role: "admin" });
        if (admin) {
          admin.walletBalance = (admin.walletBalance || 0) + updatedOrder.totalPrice;
          await admin.save();
          console.log(`Payment Marked: Credited Admin "${admin.name}" wallet with ₹${updatedOrder.totalPrice}`);
        }
      }

      res.status(200).json(
        updatedOrder
      );
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  };

  
  const getOrderById = async (
  req,
  res
) => {
  try {
    const order =
  await Order.findById(
    req.params.id
  ).populate(
    "user",
    "name email"
  );

    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


//
// CANCEL ORDER
//
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Cancellation reason is required",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Only the user who placed the order can cancel
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to cancel this order",
      });
    }

    // Cannot cancel if already delivered or already cancelled
    const nonCancellableStatuses = ["Delivered", "Cancelled", "Out For Delivery"];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    // RESTORE STOCK for each item
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.qty;
        product.soldCount = Math.max(0, product.soldCount - item.qty);
        await product.save();
      }
    }

    // REFUND to wallet if order was paid
    let refundAmount = 0;
    if (order.isPaid) {
      refundAmount = order.paidPrice || order.totalPrice;

      const user = await User.findById(req.user._id);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + refundAmount;
        await user.save();
      }
    }

    // UPDATE order
    order.orderStatus   = "Cancelled";
    order.isCancelled   = true;
    order.cancelledAt   = new Date();
    order.cancellationReason = reason.trim();
    order.refundToWallet = order.isPaid;
    order.refundAmount   = refundAmount;

    order.statusHistory.push({
      status: "Cancelled",
      updatedAt: new Date(),
    });

    const updatedOrder = await order.save();

    // SOCKET.IO real-time notification
    const io = req.app.get("io");
    if (io) {
      io.to(`order_${order._id}`).emit("orderStatusUpdated", {
        orderId: order._id,
        status: "Cancelled",
        statusHistory: updatedOrder.statusHistory,
        cancellationReason: reason.trim(),
        refundAmount,
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      message: "Order cancelled successfully",
      refundAmount,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getAllOrders,
  updateOrderStatus,
  markOrderPaid,
  getOrderById,
  cancelOrder,
};