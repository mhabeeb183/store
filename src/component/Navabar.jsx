import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { clearCart } from "../features/cart/cartSlice.js";
import { logout } from "../features/user/userSlice.js";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { useToast } from "../context/ToastContext.jsx";

const Navbar = ({ wishlistCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const cart = useSelector((state) => state.cart.items) || [];
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const { user } = useSelector((state) => state.user);
  const isAdmin = user?.role === "admin";
  const isVendor = user?.role === "vendor";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    showToast("User logged out successfully", "success");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/50 py-3.5 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent uppercase">
              FreshCart
            </span>
            <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase -mt-1">
              AI Market
            </span>
          </div>
          {isAdmin && (
            <span className="bg-amber-100 text-amber-800 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200 ml-1">
              Admin
            </span>
          )}
          {isVendor && (
            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-250 ml-1">
              Seller
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex items-center gap-6 font-semibold text-xs text-zinc-650 uppercase tracking-wide">
          {!isAdmin && (
            <li 
              onClick={() => navigate("/")} 
              className={`cursor-pointer transition-colors duration-200 hover:text-emerald-600 ${
                location.pathname === "/" ? "text-emerald-600 font-extrabold" : ""
              }`}
            >
              {t("home")}
            </li>
          )}

          {user && !isAdmin && (
            <>
              <li 
                onClick={() => navigate("/orders")} 
                className={`cursor-pointer transition-colors duration-200 hover:text-emerald-600 ${
                  location.pathname === "/orders" ? "text-emerald-600 font-extrabold" : ""
                }`}
              >
                📦 {t("myOrders")}
              </li>
              <li 
                onClick={() => navigate("/wallet")} 
                className={`cursor-pointer transition-colors duration-200 hover:text-emerald-600 ${
                  location.pathname === "/wallet" ? "text-emerald-600 font-extrabold" : ""
                }`}
              >
                💳 {t("wallet")}
              </li>
              <li 
                onClick={() => navigate("/subscription")} 
                className={`cursor-pointer transition-colors duration-200 hover:text-emerald-600 ${
                  location.pathname === "/subscription" ? "text-emerald-600 font-extrabold" : ""
                }`}
              >
                👑 {t("subscriptions")}
              </li>
              {isVendor && (
                <li 
                  onClick={() => navigate("/vendor")} 
                  className={`cursor-pointer transition-colors duration-200 hover:text-emerald-600 ${
                    location.pathname === "/vendor" ? "text-emerald-600 font-extrabold" : ""
                  }`}
                >
                  📊 {t("vendorDashboard")}
                </li>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <li 
                onClick={() => navigate("/admin/superpanel")} 
                className={`cursor-pointer transition-colors duration-200 hover:text-amber-600 ${
                  location.pathname === "/admin/superpanel" ? "text-amber-600 font-extrabold" : ""
                }`}
              >
                ⚙️ Super Panel
              </li>
              <li 
                onClick={() => navigate("/admin/products")} 
                className={`cursor-pointer transition-colors duration-200 hover:text-amber-600 ${
                  location.pathname === "/admin/products" ? "text-amber-600 font-extrabold" : ""
                }`}
              >
                🛍️ Products
              </li>
            </>
          )}
        </ul>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Wishlist Button */}
          <button 
            onClick={() => navigate("/wishlist")}
            className={`relative p-2 rounded-xl border border-zinc-200/60 hover:bg-zinc-50 hover:text-emerald-600 text-zinc-650 transition-all duration-200 cursor-pointer ${
              location.pathname === "/wishlist" ? "bg-zinc-50 text-emerald-600 border-emerald-250" : ""
            }`}
            title="Wishlist"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button 
            onClick={() => navigate("/cart")}
            className={`relative p-2 rounded-xl border border-zinc-200/60 hover:bg-zinc-50 hover:text-emerald-600 text-zinc-650 transition-all duration-200 cursor-pointer ${
              location.pathname === "/cart" ? "bg-zinc-50 text-emerald-600 border-emerald-250" : ""
            }`}
            title="Shopping Cart"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile / Login Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/profile")}
                className={`flex items-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3.5 py-1.5 rounded-xl border border-zinc-200/60 cursor-pointer transition text-xs font-semibold ${
                  location.pathname === "/profile" ? "ring-2 ring-emerald-500 bg-white border-transparent" : ""
                }`}
              >
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[9px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[80px] truncate hidden sm:inline">{user.name}</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-zinc-150 hover:bg-red-50 hover:text-red-600 text-zinc-500 p-2 rounded-xl transition duration-200 cursor-pointer"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition duration-200 shadow-md shadow-emerald-500/10 cursor-pointer">
                Login
              </button>
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;