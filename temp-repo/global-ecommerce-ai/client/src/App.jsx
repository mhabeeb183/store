import VendorDashboard from "./pages/VendorDashboard";
import VendorRoute from "./components/VendorRoute";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "./redux/authSlice";
import socket from "./socket/socket";

import { fetchProducts } from "./api/productApi";

import ProductCard from "./components/ProductCard";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import ProductDetails from "./components/ProductDetails";
import ChatWidget from "./components/chatbot/ChatWidget";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import RecommendationAnalytics from "./components/RecommendationAnalytics";
import SubscriptionPage from "./pages/SubscriptionPage";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import VendorOrders from "./pages/VendorOrders";
import AdminOrders from "./pages/AdminOrders";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import Wishlist from "./pages/Wishlist";
import Wallet from "./pages/Wallet";
import VendorEarnings from "./pages/VendorEarnings";
import VendorWithdrawals from "./pages/VendorWithdrawals";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminReviews from "./pages/AdminReviews";
import VendorReviews from "./pages/VendorReviews";
import VendorPricingDashboard from "./pages/VendorPricingDashboard";
import AdminPricingDashboard from "./pages/AdminPricingDashboard";
import MyCoupons from "./pages/MyCoupons";
import AdminCoupons from "./pages/AdminCoupons";
import AffiliateDashboard from "./pages/AffiliateDashboard";

// New Feature Pages
import WarehouseManagement from "./pages/WarehouseManagement";
import AuctionPage from "./pages/AuctionPage";
import AuctionBidding from "./pages/AuctionBidding";
import LiveStreamPage from "./pages/LiveStreamPage";
import FraudDashboard from "./pages/FraudDashboard";
import VirtualShowroom from "./pages/VirtualShowroom";
import VendorRequestForm from "./pages/VendorRequestForm";
import toast, { Toaster } from "react-hot-toast";

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    socket.on("accountSuspended", (data) => {
      toast.error(data.message || "Your account has been suspended by administration.", {
        duration: 8000,
        position: "top-center",
        style: {
          background: "#ef4444",
          color: "#fff",
          borderRadius: "12px",
          padding: "16px",
          fontWeight: "bold",
        }
      });
      dispatch(logout());
      localStorage.removeItem("userInfo");
      navigate("/login");
    });

    return () => {
      socket.off("accountSuspended");
    };
  }, [dispatch, navigate]);

  useEffect(() => {
    // Intercept standard window.alert calls and map them to custom hot toasts
    window.alert = (message) => {
      toast(message, {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#18181b",
          color: "#fff",
          borderRadius: "12px",
          border: "1px solid #27272a",
          padding: "16px",
          fontSize: "15px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)"
        },
      });
    };
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.log(error);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam !== null) {
      setSearch(searchParam);
    } else {
      setSearch("");
    }
  }, [location.search]);

  const filteredProducts = products.filter((product) => {
    if (!search.trim()) return true;

    const query = search.toLowerCase();
    const productName = product.name.toLowerCase();
    const productCategory = product.category ? product.category.toLowerCase() : "";
    const productBrand = product.brand ? product.brand.toLowerCase() : "";
    const productDesc = product.description ? product.description.toLowerCase() : "";

    // 1. Direct match (e.g. searching exact brand, category or phrase)
    if (productName.includes(query) || productCategory.includes(query) || productBrand.includes(query)) {
      return true;
    }

    // 2. Tokenize and filter conversational stop words
    const stopWords = ["i", "want", "show", "me", "find", "search", "for", "the", "a", "an", "to", "is", "of", "in", "on", "with", "buy", "please", "get", "need", "looking", "look"];
    const keywords = query
      .split(/\s+/)
      .filter((word) => !stopWords.includes(word))
      .filter((word) => word.trim().length > 0);

    if (keywords.length > 0) {
      // Check if ALL keywords match
      const allKeywordsMatch = keywords.every(
        (keyword) =>
          productName.includes(keyword) ||
          productCategory.includes(keyword) ||
          productBrand.includes(keyword) ||
          productDesc.includes(keyword)
      );
      if (allKeywordsMatch) return true;

      // Check if at least 2 keywords match, or if 1 matches when total keywords count is 1
      const matchCount = keywords.filter(
        (keyword) =>
          productName.includes(keyword) ||
          productCategory.includes(keyword) ||
          productBrand.includes(keyword)
      ).length;

      if (matchCount > 0 && matchCount >= Math.min(keywords.length, 2)) {
        return true;
      }
    }

    return false;
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <Routes>
        {/* HOME PAGE */}
        <Route
          path="/"
          element={
            <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
                  {t("trendingProducts")}
                </h1>

                <input
                  type="text"
                  placeholder={t("search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white w-full md:w-96 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                  />
                ))}
              </div>

              
            </div>
          }
        />

        {/* PRODUCT DETAILS */}
        <Route
          path="/product/:id"
          element={<ProductDetails />}
        />
        <Route
        path="/cart"
        element={<Cart />}
        />
        <Route
          path="/my-coupons"
          element={<MyCoupons />}
        />
        <Route
          path="/affiliate"
          element={
            <AffiliateDashboard />
          }
        />
        <Route
          path="/checkout"
           element={<Checkout />}
          />
          <Route
           path="/myorders"
            element={<MyOrders />}
          />
          <Route
        path="/track-order/:id"
         element={<OrderTrackingPage />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<Register />}
        />


        <Route
        path="/vendor"
        element={
          <VendorRoute>
           <VendorDashboard />
          </VendorRoute>
      }
      />
      <Route
  path="/subscriptions"
  element={<SubscriptionPage />}
/>
    <Route
  path="/vendor-orders"
  element={
    <VendorRoute>
      <VendorOrders />
    </VendorRoute>
  }
/>

<Route
  path="/vendor/reviews"
  element={
    <VendorRoute>
      <VendorReviews />
    </VendorRoute>
  }
/>

{/* ADMIN DASHBOARD */}
<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/products"
  element={
    <ProtectedRoute>
      <AdminProducts />
    </ProtectedRoute>
  }
/>


<Route
  path="/admin-orders"
  element={
    <ProtectedRoute>
      <AdminOrders />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/pricing"
  element={
    <ProtectedRoute>
      <AdminPricingDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/recommendation-analytics"
  element={
    <ProtectedRoute>
      <RecommendationAnalytics />
    </ProtectedRoute>
  }
/>
<Route
  path="/wishlist"
  element={<Wishlist />}
/>

<Route
  path="/wallet"
  element={<Wallet />}
/>
<Route
  path="/vendor/earnings"
  element={
    <VendorRoute>
      <VendorEarnings />
    </VendorRoute>
  }

/>

<Route
  path="/vendor/withdrawals"
  element={
    <VendorRoute>
      <VendorWithdrawals />
    </VendorRoute>
  }
/>
<Route
  path="/admin/withdrawals"
  element={
    <ProtectedRoute>
      <AdminWithdrawals />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/reviews"
  element={
    <ProtectedRoute>
      <AdminReviews />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/coupons"
  element={
    <ProtectedRoute>
      <AdminCoupons />
    </ProtectedRoute>
  }
/>
<Route
  path="/vendor/pricing"
  element={
    <VendorRoute>
      <VendorPricingDashboard />
    </VendorRoute>
  }
/>

{/* NEW FEATURE ROUTES */}

{/* Warehouse Management */}
<Route
  path="/admin/warehouses"
  element={
    <ProtectedRoute>
      <WarehouseManagement />
    </ProtectedRoute>
  }
/>

{/* Auction Platform */}
<Route
  path="/auctions"
  element={<AuctionPage />}
/>
<Route
  path="/auction/:id"
  element={<AuctionBidding />}
/>

{/* Live Streaming Commerce */}
<Route
  path="/livestreams"
  element={<LiveStreamPage />}
/>
<Route
  path="/livestream/:id"
  element={<LiveStreamPage />}
/>

{/* Fraud Detection Dashboard */}
<Route
  path="/admin/fraud"
  element={
    <ProtectedRoute>
      <FraudDashboard />
    </ProtectedRoute>
  }
/>

{/* AR/VR Showroom */}
<Route
  path="/virtual-showroom"
  element={<VirtualShowroom />}
/>

{/* Become a Vendor request form */}
<Route
  path="/become-vendor"
  element={<VendorRequestForm />}
/>

</Routes>
<ChatWidget />
<Toaster />
</div>
);
}

export default App;