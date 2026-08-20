import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'wishlist') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.08); // F5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {}
};

const ProductPopup = ({ product, onClose, onAddToCart, activeColor = "#3b82f6" }) => {
  const navigate = useNavigate();
  const [wishlistSuccess, setWishlistSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Default");

  const sizes = ["S", "M", "L", "XL"];
  const colors = ["Default", "Titanium", "Cosmic Blue", "Obsidian Black"];

  const handleWishlist = async () => {
    playSound('wishlist');
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      if (!userInfoStr) {
        alert("Please login first to add items to your wishlist.");
        return;
      }
      const userInfo = JSON.parse(userInfoStr);
      
      await axios.post(
        `http://localhost:5000/api/wishlist/${product._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );
      
      setWishlistSuccess(true);
      setTimeout(() => setWishlistSuccess(false), 2500);
    } catch (error) {
      console.error("Wishlist addition failed:", error);
      alert(error.response?.data?.message || "Failed to add to wishlist.");
    }
  };

  const handleAddToCartWrapper = () => {
    // Add product to cart with custom quantity
    const productWithQty = { ...product, quantity };
    onAddToCart(productWithQty);
  };

  const handleBuyNow = () => {
    playSound('click');
    const productWithQty = { ...product, quantity };
    onAddToCart(productWithQty);
    navigate("/checkout");
  };

  const handleViewProduct = () => {
    playSound('click');
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 text-white shadow-2xl relative animate-scale-up"
        style={{ boxShadow: `0 0 45px ${activeColor}20` }}
      >
        {/* Close Button */}
        <button 
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="absolute top-4 right-4 w-10 h-10 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center font-bold transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Content Layout */}
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 bg-white/5 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center shrink-0">
              <img 
                src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                alt={product.name} 
                className="max-w-[85%] max-h-[85%] object-contain"
              />
            </div>
            <div>
              {product.brand && (
                <span 
                  className="text-[9px] font-black tracking-widest uppercase border px-2.5 py-0.5 rounded-full"
                  style={{ color: activeColor, borderColor: `${activeColor}40`, backgroundColor: `${activeColor}0f` }}
                >
                  {product.brand}
                </span>
              )}
              <h3 className="text-lg font-black mt-1.5 leading-tight tracking-wide">{product.name}</h3>
              <p className="text-zinc-400 text-xs mt-1">Category: {product.category}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-white/5 border border-white/5 p-3 rounded-xl max-h-24 overflow-y-auto">
            {product.description || "No product description available."}
          </p>

          {/* Configuration Selection dropdowns */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Size</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500"
              >
                {sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Color</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500"
              >
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ratings, Stock, and Quantity Counter */}
          <div className="flex items-center justify-between border-t border-b border-zinc-900 py-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 text-base">★</span>
              <span className="font-bold">{product.averageRating || '4.5'} / 5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="font-bold text-zinc-300">
                {product.stock > 0 ? `In Stock` : 'Out of stock'}
              </span>
            </div>
            {product.stock > 0 && (
              <div className="flex items-center border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-2.5 py-1 text-zinc-400 hover:text-white font-bold transition cursor-pointer"
                >
                  -
                </button>
                <span className="px-2.5 font-bold text-white text-xs">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-2.5 py-1 text-zinc-400 hover:text-white font-bold transition cursor-pointer"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">PRICE</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black tracking-wide text-white">
                  ₹{product.dynamicPrice || product.price}
                </p>
                {product.price > (product.dynamicPrice || product.price) && (
                  <p className="text-xs text-rose-500 line-through">₹{product.price}</p>
                )}
              </div>
            </div>
            
            {product.dynamicPricingEnabled && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-xl text-right">
                <p className="text-[8px] font-black tracking-widest text-emerald-400 uppercase">AI DYNAMIC PRICE</p>
                <p className="text-[10px] font-bold text-zinc-300">Real-time dynamic adjustments</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mt-2">
            <button
              onClick={handleAddToCartWrapper}
              disabled={product.stock <= 0}
              className="sm:col-span-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-emerald-400 hover:text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🛒</span> Add
            </button>

            <button
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="sm:col-span-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg shadow-emerald-500/10 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡</span> Buy Now
            </button>
            
            <button
              onClick={handleWishlist}
              className={`sm:col-span-1 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                wishlistSuccess 
                  ? 'bg-rose-900 border border-rose-700 text-white animate-pulse' 
                  : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-rose-400 hover:text-rose-300'
              }`}
            >
              <span>❤️</span> {wishlistSuccess ? "Saved" : "Save"}
            </button>
          </div>

          {/* Secondary Action */}
          <button
            onClick={handleViewProduct}
            className="w-full bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 text-cyan-400 text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
          >
            Open Dedicated Product Page →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPopup;
