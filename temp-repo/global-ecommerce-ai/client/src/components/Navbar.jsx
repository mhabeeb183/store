import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import LanguageSwitcher from "./LanguageSwitcher";
import VoiceSearch from "./VoiceSearch";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

const Navbar = () => {
  const cartItems = useSelector((state) => state.cart.cartItems);
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Close dropdowns/menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [navigate]);

  const logoutHandler = () => {
    dispatch(logout());
    localStorage.removeItem("userInfo");
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  const role = userInfo?.user?.role || userInfo?.role;
  const isStaff = role === "admin" || role === "vendor";

  return (
    <nav className="bg-black text-white px-4 md:px-8 py-4 relative shadow-xl z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold text-blue-400 shrink-0 hover:text-blue-300 transition-colors"
        >
          Global E-Commerce
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex gap-6 items-center">
          {!isStaff && (
            <>
              <Link to="/" className="hover:text-blue-400 transition-colors font-medium">
                {t("home")}
              </Link>
              <Link to="/" className="hover:text-blue-400 transition-colors font-medium">
                {t("products")}
              </Link>
            </>
          )}

          {/* Admin Navbar Links */}
          {role === "admin" && (
            <>
              <Link to="/admin/dashboard" className="hover:text-blue-400 transition-colors font-medium">
                ⚙️ {t("adminDashboard")}
              </Link>
              <Link to="/admin-orders" className="hover:text-blue-400 transition-colors font-medium">
                🛍️ {t("adminOrders")}
              </Link>
              <Link to="/admin/products" className="hover:text-blue-400 transition-colors font-medium">
                📦 {t("adminProducts", "Manage Products")}
              </Link>
              <Link to="/admin/coupons" className="hover:text-blue-400 transition-colors font-medium">
                🏷️ {t("adminCoupons", "Manage Coupons")}
              </Link>
            </>
          )}

          {/* Vendor Navbar Links */}
          {role === "vendor" && (
            <>
              <Link to="/vendor" className="hover:text-blue-400 transition-colors font-medium">
                📊 {t("vendorDashboard")}
              </Link>
              <Link to="/vendor-orders" className="hover:text-blue-400 transition-colors font-medium">
                📦 {t("vendorOrders")}
              </Link>
            </>
          )}

          <Link to="/virtual-showroom" className="hover:text-purple-400 transition-colors font-medium">
            🥽 {t("virtualShowroom", "VR Showroom")}
          </Link>
          <Link to="/auctions" className="hover:text-yellow-400 transition-colors font-medium">
            🔨 {t("auctions")}
          </Link>
          <Link to="/livestreams" className="hover:text-red-400 transition-colors font-medium">
            📺 {t("liveStreams")}
          </Link>
        </div>

        {/* Desktop Controls (Cart, Search, Lang, Profile) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Cart */}
          {!isStaff && (
            <div className="relative">
              <Link to="/cart" className="flex items-center hover:text-blue-400 transition-colors font-medium">
                <span className="text-xl mr-1">🛒</span>
                <span>{t("cart")}</span>
              </Link>
              {cartItems.length > 0 && (
                <span className="absolute -top-2.5 -right-3.5 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {cartItems.length}
                </span>
              )}
            </div>
          )}

          <LanguageSwitcher />
          
          <VoiceSearch onSearch={(text) => navigate(`/?search=${encodeURIComponent(text)}`)} />

          {/* User Auth Section / Dropdown */}
          {userInfo ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-green-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>👤 {userInfo.user?.name || userInfo.name}</span>
                <span className="text-xs transition-transform duration-200" style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-white">{userInfo.user?.email || userInfo.email}</p>
                    <span className="inline-block mt-1 bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded uppercase font-semibold">
                      {role || "Customer"}
                    </span>
                  </div>

                  {/* Customer Links */}
                  <Link to="/myorders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    📋 {t("myOrders")}
                  </Link>
                  {!isStaff && (
                    <>
                      <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        ❤️ {t("wishlist")}
                      </Link>
                      <Link to="/subscriptions" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        ⭐ {t("subscriptions")}
                      </Link>
                    </>
                  )}
                  <Link to="/wallet" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    💰 {t("wallet")}
                  </Link>
                  <Link to="/my-coupons" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    🏷️ {t("myCoupons")}
                  </Link>

                  {/* Vendor Links */}
                  {role === "vendor" && (
                    <div className="border-t border-zinc-800 mt-2 pt-2">
                      <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Management</p>
                      <Link to="/vendor" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        📊 {t("vendorDashboard")}
                      </Link>
                      <Link to="/vendor-orders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        📦 {t("vendorOrders")}
                      </Link>
                      <Link to="/vendor/earnings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        💵 {t("vendorEarnings")}
                      </Link>
                      <Link to="/vendor/withdrawals" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        🏦 {t("vendorWithdrawals")}
                      </Link>
                      <Link to="/vendor/pricing" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        📈 {t("dynamicPricing")}
                      </Link>
                    </div>
                  )}

                  {/* Admin Links */}
                  {role === "admin" && (
                    <div className="border-t border-zinc-800 mt-2 pt-2">
                      <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Panel</p>
                      <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        ⚙️ {t("adminDashboard")}
                      </Link>
                      <Link to="/admin/products" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        📦 {t("adminProducts", "Manage Products")}
                      </Link>
                      <Link to="/admin-orders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        🛍️ {t("adminOrders")}
                      </Link>
                      <Link to="/admin/withdrawals" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        💸 {t("withdrawals")}
                      </Link>
                      <Link to="/admin/reviews" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        💬 {t("reviews")}
                      </Link>
                      <Link to="/admin/pricing" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        💲 {t("pricingPanel")}
                      </Link>
                      <Link to="/admin/warehouses" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        🏭 {t("warehouses")}
                      </Link>
                      <Link to="/admin/fraud" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        🛡️ {t("fraudDetection")}
                      </Link>
                      <Link to="/admin/coupons" className="block px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors">
                        🏷️ {t("adminCoupons", "Manage Coupons")}
                      </Link>
                    </div>
                  )}

                  {/* Logout Button */}
                  <div className="border-t border-zinc-800 mt-2 pt-2 px-2">
                    <button
                      onClick={logoutHandler}
                      className="w-full bg-red-600/90 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                {t("login")}
              </Link>
              <Link to="/register" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                {t("register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Header Row Controls */}
        <div className="flex lg:hidden items-center gap-4">
          {/* Cart */}
          {!isStaff && (
            <div className="relative mr-1">
              <Link to="/cart" className="flex items-center text-xl">
                <span>🛒</span>
              </Link>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {cartItems.length}
                </span>
              )}
            </div>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Menu overlay) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl py-6 px-6 z-40 animate-in slide-in-from-top duration-300 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Search & Language switcher inside the drawer for mobile layout */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Search:</span>
              <VoiceSearch onSearch={(text) => {
                setIsMobileMenuOpen(false);
                navigate(`/?search=${encodeURIComponent(text)}`);
              }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Language:</span>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Main Pages */}
          <div className="flex flex-col gap-3">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800 pb-1">Navigation</p>
            {!isStaff && (
              <>
                <Link to="/" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  🏠 {t("home")}
                </Link>
                <Link to="/" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  📦 {t("products")}
                </Link>
              </>
            )}

            {/* Admin Mobile Links */}
            {role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  ⚙️ {t("adminDashboard")}
                </Link>
                <Link to="/admin-orders" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  🛍️ {t("adminOrders")}
                </Link>
                <Link to="/admin/products" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  📦 {t("adminProducts", "Manage Products")}
                </Link>
              </>
            )}

            {/* Vendor Mobile Links */}
            {role === "vendor" && (
              <>
                <Link to="/vendor" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  📊 {t("vendorDashboard")}
                </Link>
                <Link to="/vendor-orders" className="text-lg font-medium hover:text-blue-400 py-1 transition-colors">
                  📦 {t("vendorOrders")}
                </Link>
              </>
            )}

            <Link to="/virtual-showroom" className="text-lg font-medium hover:text-purple-400 py-1 transition-colors">
              🥽 {t("virtualShowroom", "VR Showroom")}
            </Link>
            <Link to="/auctions" className="text-lg font-medium hover:text-yellow-400 py-1 transition-colors">
              🔨 {t("auctions")}
            </Link>
            <Link to="/livestreams" className="text-lg font-medium hover:text-red-400 py-1 transition-colors">
              📺 {t("liveStreams")}
            </Link>
          </div>

          {/* User Account / Portal Links */}
          {userInfo && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800 pb-1">
                Account Details ({role || "Customer"})
              </p>
              <div className="text-green-400 font-semibold mb-1">
                👤 Welcome, {userInfo.user?.name || userInfo.name}!
              </div>
              <Link to="/myorders" className="text-gray-300 hover:text-white py-1 transition-colors">
                📋 {t("myOrders")}
              </Link>
              {!isStaff && (
                <>
                  <Link to="/wishlist" className="text-gray-300 hover:text-white py-1 transition-colors">
                    ❤️ {t("wishlist")}
                  </Link>
                  <Link to="/subscriptions" className="text-gray-300 hover:text-white py-1 transition-colors">
                    ⭐ {t("subscriptions")}
                  </Link>
                </>
              )}
              <Link to="/wallet" className="text-gray-300 hover:text-white py-1 transition-colors">
                💰 {t("wallet")}
              </Link>
              <Link to="/my-coupons" className="text-gray-300 hover:text-white py-1 transition-colors">
                🏷️ {t("myCoupons")}
              </Link>
            </div>
          )}

          {/* Vendor Portal */}
          {userInfo && role === "vendor" && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800 pb-1">Vendor Portal</p>
              <Link to="/vendor" className="text-gray-300 hover:text-white py-1 transition-colors">
                📊 {t("vendorDashboard")}
              </Link>
              <Link to="/vendor-orders" className="text-gray-300 hover:text-white py-1 transition-colors">
                📦 {t("vendorOrders")}
              </Link>
              <Link to="/vendor/earnings" className="text-gray-300 hover:text-white py-1 transition-colors">
                💵 {t("vendorEarnings")}
              </Link>
              <Link to="/vendor/withdrawals" className="text-gray-300 hover:text-white py-1 transition-colors">
                🏦 {t("vendorWithdrawals")}
              </Link>
              <Link to="/vendor/pricing" className="text-gray-300 hover:text-white py-1 transition-colors">
                📈 {t("dynamicPricing")}
              </Link>
            </div>
          )}

          {/* Admin Portal */}
          {userInfo && role === "admin" && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-800 pb-1">Admin Portal</p>
              <Link to="/admin/dashboard" className="text-gray-300 hover:text-white py-1 transition-colors">
                ⚙️ {t("adminDashboard")}
              </Link>
              <Link to="/admin/products" className="text-gray-300 hover:text-white py-1 transition-colors">
                📦 {t("adminProducts", "Manage Products")}
              </Link>
              <Link to="/admin-orders" className="text-gray-300 hover:text-white py-1 transition-colors">
                🛍️ {t("adminOrders")}
              </Link>
              <Link to="/admin/withdrawals" className="text-gray-300 hover:text-white py-1 transition-colors">
                💸 {t("withdrawals")}
              </Link>
              <Link to="/admin/reviews" className="text-gray-300 hover:text-white py-1 transition-colors">
                💬 {t("reviews")}
              </Link>
              <Link to="/admin/pricing" className="text-gray-300 hover:text-white py-1 transition-colors">
                💲 {t("pricingPanel")}
              </Link>
              <Link to="/admin/warehouses" className="text-gray-300 hover:text-white py-1 transition-colors">
                🏭 {t("warehouses")}
              </Link>
              <Link to="/admin/fraud" className="text-gray-300 hover:text-white py-1 transition-colors">
                🛡️ {t("fraudDetection")}
              </Link>
              <Link to="/admin/coupons" className="text-gray-300 hover:text-white py-1 transition-colors">
                🏷️ {t("adminCoupons", "Manage Coupons")}
              </Link>
            </div>
          )}

          {/* Auth Action Buttons */}
          <div className="border-t border-zinc-800 pt-4 mt-2">
            {userInfo ? (
              <button
                onClick={logoutHandler}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                {t("logout")}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-semibold transition-colors block"
                >
                  {t("login")}
                </Link>
                <Link
                  to="/register"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-xl font-semibold transition-colors block"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
