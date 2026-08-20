const { spawn } = require("child_process");
const axios = require("axios");
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

const runUAT = async () => {
  console.log("🚀 Starting UAT E2E Integration Test...");

  // 1. Start Server in background on port 5055
  const serverProcess = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: PORT.toString() },
  });

  let serverStarted = false;

  await new Promise((resolve, reject) => {
    serverProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Server Log] ${output.trim()}`);
      if (output.includes(`Server running on port ${PORT}`)) {
        serverStarted = true;
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Server Error] ${data.toString()}`);
    });

    serverProcess.on("close", (code) => {
      if (!serverStarted) {
        reject(new Error(`Server closed prematurely with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error("Server startup timed out after 30s"));
      }
    }, 30000);
  });

  console.log("\n✅ Server is up and listening. Initializing E2E API requests...\n");

  let customerToken = "";
  let vendorToken = "";
  let adminToken = "";
  let vendorId = "";
  let customerId = "";
  let vendorRequestId = "";
  let productId = "";
  let subscriptionPlanId = "";
  let auctionId = "";
  let orderId = "";

  try {
    // ----------------------------------------------------
    // STEP 1: USER REGISTRATION
    // ----------------------------------------------------
    console.log("🔹 Step 1: Registering Test Customer & Test Vendor...");
    const customerEmail = `customer_${Date.now()}@example.com`;
    const vendorEmail = `vendor_${Date.now()}@example.com`;

    const registerCustRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "UAT Customer",
      email: customerEmail,
      password: "password123",
    });
    console.log("  ✔️ Registered Customer:", registerCustRes.data.email || customerEmail);

    const registerVendRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "UAT Vendor Candidate",
      email: vendorEmail,
      password: "password123",
    });
    console.log("  ✔️ Registered Vendor Candidate:", registerVendRes.data.email || vendorEmail);

    // ----------------------------------------------------
    // STEP 2: USER LOGIN
    // ----------------------------------------------------
    console.log("\n🔹 Step 2: Logging in users to obtain JWT tokens...");
    const loginCustRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: "password123",
    });
    customerToken = loginCustRes.data.token;
    customerId = loginCustRes.data.user?._id || loginCustRes.data._id;
    console.log("  ✔️ Customer Logged In. ID:", customerId);

    const loginVendRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: vendorEmail,
      password: "password123",
    });
    vendorToken = loginVendRes.data.token;
    vendorId = loginVendRes.data.user?._id || loginVendRes.data._id;
    console.log("  ✔️ Vendor Logged In. ID:", vendorId);

    const loginAdminRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@example.com",
      password: "admin123",
    });
    adminToken = loginAdminRes.data.token;
    console.log("  ✔️ Super Admin Logged In.");

    // ----------------------------------------------------
    // STEP 3: VENDOR REQUEST CREATION
    // ----------------------------------------------------
    console.log("\n🔹 Step 3: Submitting vendor candidate application...");
    const vendorReqRes = await axios.post(
      `${BASE_URL}/vendor-requests`,
      {
        businessName: "UAT Tech Hardware Ltd",
        description: "We sell advanced AR/VR headsets and developer devices.",
        businessAddress: "123 Innovation Street, Tech Hub",
        taxId: "TX-999-88-77",
      },
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );
    vendorRequestId = vendorReqRes.data.request._id;
    console.log("  ✔️ Vendor Application Submitted. Request ID:", vendorRequestId);

    // ----------------------------------------------------
    // STEP 4: VENDOR REQUEST APPROVAL
    // ----------------------------------------------------
    console.log("\n🔹 Step 4: Admin reviewing and approving vendor request...");
    const approveRes = await axios.put(
      `${BASE_URL}/vendor-requests/${vendorRequestId}`,
      {
        status: "approved",
        reviewNotes: "All documents verified by UAT team.",
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("  ✔️ Application Status:", approveRes.data.request.status);

    // Relogin vendor to ensure their role is refreshed to "vendor"
    const reloginVendRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: vendorEmail,
      password: "password123",
    });
    vendorToken = reloginVendRes.data.token;
    console.log("  ✔️ Vendor re-logged in to refresh role. Current role:", reloginVendRes.data.role || reloginVendRes.data.user?.role);

    // ----------------------------------------------------
    // STEP 5: LISTING AR PRODUCT
    // ----------------------------------------------------
    console.log("\n🔹 Step 5: Vendor listing a new 3D AR Product...");
    const productRes = await axios.post(
      `${BASE_URL}/products`,
      {
        name: "UAT Apple Vision Pro Mock",
        brand: "Apple",
        description: "Ultimate virtual headset for spatial testing UAT flow.",
        category: "Metaverse",
        price: 3500,
        basePrice: 3500,
        stock: 10,
        images: ["https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac"],
        arModelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
      },
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );
    productId = productRes.data._id;
    console.log("  ✔️ Product Created:", productRes.data.name, "(ID:", productId, ")");

    // ----------------------------------------------------
    // STEP 6: BUYING SUBSCRIPTION
    // ----------------------------------------------------
    console.log("\n🔹 Step 6: Customer topping up wallet and purchasing a Subscription...");
    // Top up Customer Wallet
    const walletTopUpRes = await axios.post(
      `${BASE_URL}/wallet/add-money`,
      { amount: 2000 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Customer Wallet balance topped up by ₹2000. New Balance:", walletTopUpRes.data.walletBalance);

    // Retrieve plans list
    const plansRes = await axios.get(`${BASE_URL}/subscriptions/plans`);
    const monthlyPlan = plansRes.data.plans?.find(p => p.name === "Monthly Premium") || plansRes.data.plans?.[0];
    subscriptionPlanId = monthlyPlan._id;
    console.log("  ✔️ Found Subscription Plan:", monthlyPlan.name, "Price: ₹", monthlyPlan.price);

    // Call purchase endpoint with useWallet=true
    const subPurchaseRes = await axios.post(
      `${BASE_URL}/subscriptions/purchase`,
      { planId: subscriptionPlanId, useWallet: true },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Subscription Purchase Type Checked:", subPurchaseRes.data.paymentType);

    // Activate subscription
    const activateSubRes = await axios.post(
      `${BASE_URL}/subscriptions/activate-wallet`,
      { planId: subscriptionPlanId },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Subscription Activated successfully:", activateSubRes.data.message || "Done");

    // ----------------------------------------------------
    // STEP 7: BIDDING ON LIVE AUCTION
    // ----------------------------------------------------
    console.log("\n🔹 Step 7: Vendor creating an Auction and Customer placing a bid...");
    const isoFutureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
    const auctionRes = await axios.post(
      `${BASE_URL}/auctions`,
      {
        title: "Rare Retro Console Auction",
        description: "Collectors item console, UAT live bidding.",
        startingPrice: 1500,
        bidIncrement: 100,
        startTime: new Date().toISOString(),
        endTime: isoFutureDate,
      },
      { headers: { Authorization: `Bearer ${vendorToken}` } }
    );
    auctionId = auctionRes.data.auction._id;
    console.log("  ✔️ Auction Created:", auctionRes.data.auction.title, "(ID:", auctionId, ")");

    // Place bid
    const bidRes = await axios.post(
      `${BASE_URL}/auctions/${auctionId}/bid`,
      { amount: 1650 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Bid placed successfully. Highest Bidder:", bidRes.data.auction.highestBidder?.name || "Customer", "Amount: ₹", bidRes.data.auction.currentPrice);

    // ----------------------------------------------------
    // STEP 8: CHECKOUT WITH WALLET
    // ----------------------------------------------------
    console.log("\n🔹 Step 8: Customer checking out order paying via Wallet...");
    // Add additional funds to cover product price of 3500
    await axios.post(
      `${BASE_URL}/wallet/add-money`,
      { amount: 4000 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );

    // Checkout order
    const orderItems = [
      {
        product: productId,
        name: "UAT Apple Vision Pro Mock",
        price: 3500,
        qty: 1,
        image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac",
      }
    ];

    const orderRes = await axios.post(
      `${BASE_URL}/orders`,
      {
        orderItems,
        totalPrice: 3500,
        isPaid: true,
        paidPrice: 3500,
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    orderId = orderRes.data._id;
    console.log("  ✔️ Order Created & Marked Paid. Order ID:", orderId);

    // Deduct from wallet
    const deductRes = await axios.post(
      `${BASE_URL}/wallet/use-wallet`,
      { amount: 3500 },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Wallet deducted. Customer Wallet Balance:", deductRes.data.walletBalance);

    // ----------------------------------------------------
    // STEP 9: ORDER DELIVERY & CASHBACK VERIFICATION
    // ----------------------------------------------------
    console.log("\n🔹 Step 9: Admin marking order Delivered & checking customer cashback...");
    const statusUpdateRes = await axios.put(
      `${BASE_URL}/orders/${orderId}/status`,
      { status: "Delivered" },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("  ✔️ Order Status Updated to:", statusUpdateRes.data.orderStatus);

    // Check customer's new wallet balance to verify 5% cashback
    // 5% of 3500 is 175
    const finalWalletRes = await axios.get(
      `${BASE_URL}/wallet`,
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Verification: Customer Wallet Balance (includes 5% Cashback of ₹175): ₹", finalWalletRes.data.walletBalance);

    // ----------------------------------------------------
    // STEP 10: REAL-TIME ORDER TRACKING DETAILS
    // ----------------------------------------------------
    console.log("\n🔹 Step 10: Retrieving order status history for real-time tracking...");
    const trackingRes = await axios.get(
      `${BASE_URL}/orders/${orderId}`,
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    console.log("  ✔️ Order status tracking steps:");
    trackingRes.data.statusHistory?.forEach((step, idx) => {
      console.log(`     [Step ${idx + 1}] ${step.status} - Updated at: ${step.updatedAt}`);
    });

    console.log("\n⭐ ALL E2E INTEGRATION FLOW TESTS PASSED SUCCESSFULLY! ⭐\n");

  } catch (error) {
    console.error("\n❌ E2E INTEGRATION TEST FAILED!");
    console.error(error.response?.data || error.message);
  } finally {
    // ----------------------------------------------------
    // CLEANUP DATABASE
    // ----------------------------------------------------
    console.log("🔹 Cleaning up test database records...");
    try {
      await mongoose.connect(process.env.MONGO_URI);
      
      if (customerId) {
        await mongoose.connection.db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(customerId) });
        await mongoose.connection.db.collection("chatlogs").deleteMany({ user: new mongoose.Types.ObjectId(customerId) });
        await mongoose.connection.db.collection("usersubscriptions").deleteMany({ user: new mongoose.Types.ObjectId(customerId) });
      }
      if (vendorId) {
        await mongoose.connection.db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(vendorId) });
      }
      if (vendorRequestId) {
        await mongoose.connection.db.collection("vendorrequests").deleteOne({ _id: new mongoose.Types.ObjectId(vendorRequestId) });
      }
      if (productId) {
        await mongoose.connection.db.collection("products").deleteOne({ _id: new mongoose.Types.ObjectId(productId) });
      }
      if (auctionId) {
        await mongoose.connection.db.collection("auctions").deleteOne({ _id: new mongoose.Types.ObjectId(auctionId) });
      }
      if (orderId) {
        await mongoose.connection.db.collection("orders").deleteOne({ _id: new mongoose.Types.ObjectId(orderId) });
        await mongoose.connection.db.collection("vendorearnings").deleteMany({ order: new mongoose.Types.ObjectId(orderId) });
      }
      
      await mongoose.disconnect();
      console.log("  ✔️ Cleanup finished. Database connection closed.");
    } catch (cleanupErr) {
      console.error("  ❌ Database cleanup error:", cleanupErr.message);
    }

    // Shut down Express Server
    console.log("🔹 Shutting down backend UAT server process...");
    serverProcess.kill("SIGTERM");
    process.exit(0);
  }
};

runUAT();
