import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchCart } from "./features/cart/cartSlice.js";
import { logout } from "./features/user/userSlice.js";
import ProductPage from "./component/productpage";
import Footer from "./component/Footer";
import CartPage from "./component/Cart";
import PaymentPage from "./component/PaymentPage";
import WishlistPage from "./component/Wishlist";
import AuthPage from "./component/AuthPage";
import ProtectedRoute from "./component/ProtectedRoute";
import AdminRoute from "./component/AdminRoute";
import AdminProducts from "./component/AdminProducts";
import Checkout from "./component/Checkout";
import OrderPage from "./component/OrderPage";
import ProfilePage from "./component/ProfilePage";
import ChatWidget from "./component/ChatWidget";

// Migrated page components
import Wallet from "./component/Wallet.jsx";
import SubscriptionPage from "./component/SubscriptionPage.jsx";
import OrderTrackingPage from "./component/OrderTrackingPage.jsx";
import VendorDashboard from "./component/VendorDashboard.jsx";
import AdminSuperPanel from "./component/AdminSuperPanel.jsx";
import { useToast } from "./context/ToastContext.jsx";

function App() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Fetch cart items for logged-in user
      dispatch(fetchCart());

      // Fetch wishlist items with auth header
      fetch("/api/wishlist", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              dispatch(logout());
            }
            throw new Error("Unauthorized");
          }
          return res.json();
        })
        .then((data) => setWishlist(data))
        .catch((err) => console.error("Error fetching wishlist:", err));
    }
  }, [dispatch]);

  const toggleWishlist = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please log in to add items to your wishlist!", "warning");
      return;
    }
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to toggle wishlist");
      const data = await res.json();
      setWishlist(data);
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ProductPage
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
            />
          }
        />
     
        <Route element={<ProtectedRoute />}>
          <Route
            path="/cart"
            element={
              <CartPage
                wishlist={wishlist}
              />
            }
          />
          <Route
            path="/wishlist"
            element={
              <WishlistPage
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
            }
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment" element={<PaymentPage />} />
          
          {/* Migrated routes under auth */}
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/tracking/:id" element={<OrderTrackingPage />} />
          <Route path="/vendor" element={<VendorDashboard />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<OrderPage />} />
          
          {/* Migrated admin panel route */}
          <Route path="/admin/superpanel" element={<AdminSuperPanel />} />
        </Route>

        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
      </Routes>
      <Footer />
      <ChatWidget />
    </>
  );
}

export default App;