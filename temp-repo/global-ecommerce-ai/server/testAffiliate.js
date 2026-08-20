const axios = require("axios");
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTest() {
  console.log("🚀 Starting E2E Affiliate Marketing Integration Test...");

  let promoterToken = "";
  let customerToken = "";
  let adminToken = "";
  
  let promoterId = "";
  let customerId = "";
  let productId = "";
  let affiliateId = "";
  let orderId = "";
  let affiliateCode = "";

  try {
    // ----------------------------------------------------
    // STEP 1: ADMIN LOGIN
    // ----------------------------------------------------
    console.log("\n🔹 Step 1: Logging in as Super Admin...");
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@example.com",
      password: "admin123",
    });
    adminToken = adminLogin.data.token;
    console.log("  ✔️ Admin logged in successfully.");

    // ----------------------------------------------------
    // STEP 2: REGISTER PROMOTER & CUSTOMER
    // ----------------------------------------------------
    console.log("\n🔹 Step 2: Registering Test Promoter and Test Customer...");
    const promoterEmail = `promoter_${Date.now()}@example.com`;
    const customerEmail = `customer_${Date.now()}@example.com`;

    const regPromoter = await axios.post(`${BASE_URL}/auth/register`, {
      name: "UAT Promoter",
      email: promoterEmail,
      password: "password123",
    });
    promoterId = regPromoter.data._id || regPromoter.data.user?._id;
    console.log("  ✔️ Registered Promoter ID:", promoterId);

    const regCustomer = await axios.post(`${BASE_URL}/auth/register`, {
      name: "UAT Customer",
      email: customerEmail,
      password: "password123",
    });
    customerId = regCustomer.data._id || regCustomer.data.user?._id;
    console.log("  ✔️ Registered Customer ID:", customerId);

    // Get login tokens
    const loginPromoter = await axios.post(`${BASE_URL}/auth/login`, {
      email: promoterEmail,
      password: "password123",
    });
    promoterToken = loginPromoter.data.token;

    const loginCustomer = await axios.post(`${BASE_URL}/auth/login`, {
      email: customerEmail,
      password: "password123",
    });
    customerToken = loginCustomer.data.token;

    // Get an existing product to reference
    const productsRes = await axios.get(`${BASE_URL}/products`);
    const testProduct = Array.isArray(productsRes.data)
      ? productsRes.data[0]
      : productsRes.data.products?.[0];
    if (!testProduct) {
      throw new Error("No products found in the database to run the affiliate test.");
    }
    productId = testProduct._id;
    const productPrice = testProduct.price;
    console.log(`  ✔️ Using test product "${testProduct.name}" at price ₹${productPrice}`);

    // ----------------------------------------------------
    // STEP 3: GENERATE AFFILIATE LINK
    // ----------------------------------------------------
    console.log("\n🔹 Step 3: Generating affiliate link as Promoter...");
    const genLinkRes = await axios.post(
      `${BASE_URL}/affiliate/generate`,
      { productId },
      { headers: { Authorization: `Bearer ${promoterToken}` } }
    );
    affiliateCode = genLinkRes.data.affiliateCode;
    affiliateId = genLinkRes.data.affiliate._id;
    console.log(`  ✔️ Generated link: ${genLinkRes.data.affiliateLink}`);
    console.log(`  ✔️ Affiliate Code: ${affiliateCode}`);

    // ----------------------------------------------------
    // STEP 4: TRACK CLICK
    // ----------------------------------------------------
    console.log("\n🔹 Step 4: Simulating click on the affiliate link...");
    const clickRes = await axios.put(`${BASE_URL}/affiliate/click/${affiliateCode}`);
    console.log(`  ✔️ Click tracked. Current click count: ${clickRes.data.clicks}`);

    // ----------------------------------------------------
    // STEP 5: PURCHASE VIA AFFILIATE CODE
    // ----------------------------------------------------
    console.log("\n🔹 Step 5: Customer placing order using the affiliate code...");
    const orderItems = [
      {
        product: productId,
        name: testProduct.name,
        price: productPrice,
        qty: 1,
        image: testProduct.images?.[0] || "",
      }
    ];

    const orderRes = await axios.post(
      `${BASE_URL}/orders`,
      {
        orderItems,
        totalPrice: productPrice,
        isPaid: true,
        paidPrice: productPrice,
        affiliateCode,
        shippingDetails: {
          address: "123 Test Street",
          city: "Tech City",
          postalCode: "12345",
          country: "India"
        },
        paymentMethod: "Razorpay"
      },
      { headers: { Authorization: `Bearer ${customerToken}` } }
    );
    orderId = orderRes.data._id;
    console.log(`  ✔️ Order created successfully. Order ID: ${orderId}`);

    // ----------------------------------------------------
    // STEP 6: VERIFY PENDING COMMISSION ON DASHBOARD
    // ----------------------------------------------------
    console.log("\n🔹 Step 6: Verifying pending commission on Promoter Dashboard...");
    const dashRes = await axios.get(
      `${BASE_URL}/affiliate/dashboard`,
      { headers: { Authorization: `Bearer ${promoterToken}` } }
    );
    
    const promoRecord = dashRes.data.affiliates.find(a => a._id === affiliateId);
    console.log("  ✔️ Total Dashboard Clicks:", dashRes.data.totalClicks);
    console.log("  ✔️ Total Dashboard Orders:", dashRes.data.totalOrders);
    console.log("  ✔️ Commission Earned:", promoRecord?.commissionEarned);
    console.log("  ✔️ Payout Status:", promoRecord?.payoutStatus);

    const expectedCommission = (productPrice * 5) / 100;
    if (promoRecord?.commissionEarned !== expectedCommission) {
      throw new Error(`Expected commission to be ₹${expectedCommission}, but got ₹${promoRecord?.commissionEarned}`);
    }
    if (promoRecord?.payoutStatus !== "Pending") {
      throw new Error(`Expected payout status to be 'Pending', but got '${promoRecord?.payoutStatus}'`);
    }
    console.log("  ✔️ Pending commission matches 5% of order price perfectly.");

    // Check promoter wallet balance before approval
    const promoterProfileBefore = await axios.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${promoterToken}` }
    });
    console.log("  ✔️ Promoter wallet balance before payout approval: ₹", promoterProfileBefore.data.walletBalance || 0);

    // ----------------------------------------------------
    // STEP 7: ADMIN APPROVES PAYOUT
    // ----------------------------------------------------
    console.log("\n🔹 Step 7: Admin approving the payout...");
    const payoutRes = await axios.put(
      `${BASE_URL}/affiliate/admin/payout/${affiliateId}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`  ✔️ Admin Payout approval message: "${payoutRes.data.message}"`);

    // ----------------------------------------------------
    // STEP 8: VERIFY WALLET TOP-UP
    // ----------------------------------------------------
    console.log("\n🔹 Step 8: Verifying promoter's wallet is credited...");
    const promoterProfileAfter = await axios.get(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${promoterToken}` }
    });
    const finalBalance = promoterProfileAfter.data.walletBalance;
    console.log(`  ✔️ Promoter wallet balance after payout approval: ₹${finalBalance}`);

    if (finalBalance !== expectedCommission) {
      throw new Error(`Expected wallet balance to be ₹${expectedCommission}, but got ₹${finalBalance}`);
    }
    console.log("  ✔️ Commission successfully credited to Promoter's wallet!");

    // ----------------------------------------------------
    // STEP 9: TEST DOUBLE APPROVAL PREVENTION
    // ----------------------------------------------------
    console.log("\n🔹 Step 9: Testing double payout approval prevention...");
    try {
      await axios.put(
        `${BASE_URL}/affiliate/admin/payout/${affiliateId}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      throw new Error("Double payout approval should have failed but succeeded!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("already been approved")) {
        console.log(`  ✔️ Correctly rejected double approval: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    console.log("\n⭐ E2E AFFILIATE MARKETING INTEGRATION TEST PASSED SUCCESSFULLY! ⭐\n");

  } catch (error) {
    console.error("\n❌ E2E AFFILIATE MARKETING TEST FAILED!");
    console.error(error.response?.data || error.message);
  } finally {
    // ----------------------------------------------------
    // DB CLEANUP
    // ----------------------------------------------------
    console.log("🔹 Cleaning up test database records...");
    try {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerceDB");
      
      if (promoterId) {
        await mongoose.connection.db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(promoterId) });
      }
      if (customerId) {
        await mongoose.connection.db.collection("users").deleteOne({ _id: new mongoose.Types.ObjectId(customerId) });
      }
      if (affiliateId) {
        await mongoose.connection.db.collection("affiliates").deleteOne({ _id: new mongoose.Types.ObjectId(affiliateId) });
      }
      if (orderId) {
        await mongoose.connection.db.collection("orders").deleteOne({ _id: new mongoose.Types.ObjectId(orderId) });
      }
      
      await mongoose.disconnect();
      console.log("  ✔️ Cleanup finished. Database connection closed.");
    } catch (cleanupErr) {
      console.error("  ❌ Database cleanup error:", cleanupErr.message);
    }
  }
}

runTest();
