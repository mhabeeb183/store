import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addToCartAsync } from "../features/cart/cartSlice.js";
import Navbar from "./Navabar";
import VoiceSearch from "./VoiceSearch.jsx";
import { useToast } from "../context/ToastContext.jsx";

const ProductPage = ({ wishlist = [], toggleWishlist }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const cart = useSelector((state) => state.cart.items);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // AI Recommendations state
  const [aiRecs, setAiRecs] = useState([]);
  
  const token = localStorage.getItem("token");

  // Fetch products catalog
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          setFilteredProducts(data);
          
          // Fetch AI Recommendations based on the first catalog item as base seed
          if (data.length > 0) {
            fetchAIRecommendations(data[0]._id);
          }
        }
      })
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // Filter products by search term (text search or speech recognition transcripts)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const match = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(match) ||
          (p.category && p.category.toLowerCase().includes(match)) ||
          (p.brand && p.brand.toLowerCase().includes(match))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Fetch AI Recommendations from server
  const fetchAIRecommendations = async (productId) => {
    try {
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // If user logged in, fetch personalized recommendations, else fetch similarity matching
      const url = token ? "/api/recommendations/personalized" : `/api/recommendations/product/${productId}`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const recData = await res.json();
        setAiRecs(recData.slice(0, 4)); // limit to 4 items
      }
    } catch (err) {
      console.error("Fetch AI recommendations failed:", err.message);
    }
  };

  const handleVoiceSearch = (phrase) => {
    setSearchTerm(phrase);
  };

  const handleBuyNow = async (prod) => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please log in to purchase items!", "warning");
      navigate("/login");
      return;
    }

    try {
      navigate("/checkout", { state: { buyNowItem: prod } });
    } catch (err) {
      console.error("Failed to navigate for Buy Now:", err);
    }
  };

  const handleRecommendationClick = async (productId) => {
    try {
      // Record CTR Analytics click tracking event
      await fetch("/api/recommendations/click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({ productId }),
      });
    } catch (err) {
      console.error("Click analytic report failed:", err.message);
    }
  };

  return (
    <div className="bg-zinc-50/50 min-h-screen flex flex-col">
      <Navbar wishlistCount={wishlist.length} />

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-zinc-900 text-white py-16 px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/30 inline-block mb-4 shadow-sm">
            🧑‍🌾 Fresh from the Farms
          </span>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-6">
            Pure Organic Groceries <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8 font-medium leading-relaxed">
            Pick from our premium, organic leafy greens, farm-raised fresh produce, and dairy essentials. Powered by our interactive AI shopping chatbot.
          </p>

          {/* Combined Text Search & Native Voice Search Bar */}
          <div className="max-w-md mx-auto mb-8 relative flex items-center bg-white p-1.5 rounded-2xl border border-zinc-200/80 shadow-lg text-zinc-800 gap-2">
            <span className="pl-3 text-zinc-400 text-base">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search")}
              className="flex-1 bg-transparent border-none text-zinc-800 placeholder-zinc-400 focus:outline-none text-sm font-semibold py-1.5"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-xs px-2 cursor-pointer"
              >
                ✕
              </button>
            )}
            <VoiceSearch onSearch={handleVoiceSearch} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-zinc-300">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              ✨ 100% Quality Guaranteed
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              🛵 Speed Delivery Service
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              💬 Smart AI Assistant Helper
            </span>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-200/50 pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-800 tracking-tight">Our Premium Products</h2>
            <p className="text-xs text-zinc-500 font-medium">Select from the fresh grocery items catalog</p>
          </div>
          <span className="bg-zinc-100 text-zinc-650 text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-200/60 shadow-sm">
            Showing {filteredProducts.length} Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => {
            const isInWishlist = wishlist.some((item) => item.id === prod.id);

            return (
              <div
                key={prod.id}
                className="bg-white border border-zinc-200/50 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image Container with Absolute Wishlist Button */}
                <div className="relative bg-zinc-50 overflow-hidden h-[240px] border-b border-zinc-100 flex items-center justify-center">
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />

                  {/* Absolute Heart Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(prod)}
                    className={`absolute top-3.5 right-3.5 p-2 rounded-full border shadow-sm transition-all cursor-pointer ${
                      isInWishlist
                        ? "bg-red-50 text-red-500 border-red-100 scale-105"
                        : "bg-white/80 hover:bg-white text-zinc-400 hover:text-zinc-600 border-zinc-200/50 backdrop-blur-sm"
                    }`}
                    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <svg className="w-4 h-4" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Category Tag Overlay */}
                  <span className="absolute bottom-3.5 left-3.5 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm">
                    {prod.category || "Fresh Grocery"}
                  </span>
                </div>

                {/* Details Container */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="font-bold text-zinc-800 text-base leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {prod.name}
                    </h3>
                    <p className="text-zinc-400 text-xs font-semibold mt-0.5">{prod.brand || "Premium Quality"}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto mb-4 bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-400">Price:</span>
                    <span className="text-emerald-600 font-extrabold text-base leading-none">
                      {prod.price}
                    </span>
                  </div>

                  {/* Buy / Cart Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => dispatch(addToCartAsync(prod))}
                      className="flex-1 bg-emerald-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl hover:bg-emerald-700 active:scale-98 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      {t("addToCart")}
                    </button>
                    
                    <button
                      onClick={() => handleBuyNow(prod)}
                      className="flex-1 bg-orange-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl hover:bg-orange-600 active:scale-98 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {t("buyNow")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Recommendations Panel */}
      {aiRecs.length > 0 && (
        <section className="bg-emerald-50/30 border-t border-zinc-200/50 py-12 px-6">
          <div className="max-w-7xl w-full mx-auto">
            <div className="mb-8">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block">
                ⚡ {token ? "Personalized For You" : "Smart Matching"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-800 tracking-tight mt-2.5">
                {t("recommendedProducts")}
              </h2>
              <p className="text-xs text-zinc-500 font-semibold mt-0.5">AI-powered recommendations based on products similarity math</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {aiRecs.map((rec) => (
                <div
                  key={rec._id}
                  onClick={() => handleRecommendationClick(rec._id)}
                  className="bg-white border rounded-2xl p-3 flex flex-col justify-between hover:shadow-md cursor-pointer transition shadow-sm"
                >
                  <div className="relative bg-zinc-50 rounded-xl overflow-hidden h-36 flex items-center justify-center">
                    <img src={rec.image} alt={rec.name} className="w-full h-full object-cover" />
                    {rec.similarityScore && (
                      <span className="absolute top-2 right-2 bg-emerald-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded">
                        {Math.round(rec.similarityScore * 100)}% Sim
                      </span>
                    )}
                    {rec.aiScore && (
                      <span className="absolute top-2 right-2 bg-teal-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded">
                        {Math.round(rec.aiScore * 100)}% Match
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="font-extrabold text-xs text-zinc-800 truncate">{rec.name}</h4>
                    <p className="text-emerald-600 font-black text-xs mt-1">{rec.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductPage;