import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/cartSlice';

import PanoramaViewer from '../components/vr/PanoramaViewer';
import ProductPopup from '../components/vr/ProductPopup';
import MiniMap from '../components/vr/MiniMap';
import SceneLoader from '../components/vr/SceneLoader';
import AdminVRPanel from '../components/vr/AdminVRPanel';

const speakText = (text) => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.15;
    window.speechSynthesis.speak(utterance);
  }
};

const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'teleport') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'cart') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {}
};

const VirtualShowroom = () => {
  // VR Scenes & Hotspots data
  const [scenes, setScenes] = useState([]);
  const [activeScene, setActiveScene] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  
  // UI Overlays
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Initializing Showroom...");
  const [toastMessage, setToastMessage] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAdminEditorOpen, setIsAdminEditorOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isCategoriesDrawerOpen, setIsCategoriesDrawerOpen] = useState(false);

  // Search Inside VR
  const [searchQuery, setSearchQuery] = useState("");
  const [lookAtCoords, setLookAtCoords] = useState(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState(null);

  // Visual Editor coordinates (clicked on sphere)
  const [pendingClickCoords, setPendingClickCoords] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.cartItems);
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const categoryScenes = [
    { name: "Kids", sceneName: "Kids Section", icon: "🧸", gradient: "from-pink-500/20 to-rose-600/20 border-pink-500/30 text-pink-400" },
    { name: "Men", sceneName: "Men's Fashion", icon: "👞", gradient: "from-blue-500/20 to-indigo-600/20 border-blue-500/30 text-blue-400" },
    { name: "Women", sceneName: "Women's Fashion", icon: "👗", gradient: "from-purple-500/20 to-fuchsia-600/20 border-purple-500/30 text-purple-400" },
    { name: "Electronics", sceneName: "Electronics Center", icon: "⚡", gradient: "from-cyan-500/20 to-sky-600/20 border-cyan-500/30 text-cyan-400" },
    { name: "Grocery", sceneName: "Grocery Mart", icon: "🍎", gradient: "from-green-500/20 to-emerald-600/20 border-green-500/30 text-green-400" },
    { name: "Furniture", sceneName: "Furniture Lounge", icon: "🛋️", gradient: "from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400" },
    { name: "Beauty", sceneName: "Beauty & Cosmetics", icon: "💄", gradient: "from-red-500/20 to-pink-600/20 border-red-500/30 text-red-400" },
    { name: "Sports", sceneName: "Sports & Outdoors", icon: "⚽", gradient: "from-teal-500/20 to-emerald-600/20 border-teal-500/30 text-teal-400" },
  ];

  // 1. Check if logged-in user is admin to show panel toggles
  useEffect(() => {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      const role = userInfo.user?.role || userInfo.role;
      if (role === "admin") {
        setIsAdminUser(true);
      }
    }
  }, []);

  // 2. Fetch all Scenes/Rooms from MERN API
  const fetchScenes = async () => {
    try {
      setLoadingMessage("Fetching department rooms...");
      const { data } = await axios.get("http://localhost:5000/api/scenes");
      setScenes(data);
      
      if (data.length > 0) {
        // Default to Lobby scene
        const lobby = data.find(s => s.name.toLowerCase() === "lobby") || data[0];
        setActiveScene(lobby);
      } else {
        setLoadingMessage("Showroom database is empty. Please check seed files.");
      }
    } catch (err) {
      console.error("Failed to load scenes:", err);
      setLoadingMessage("Failed to load VR Store database.");
    }
  };

  useEffect(() => {
    fetchScenes();
  }, []);

  // 3. Fetch Hotspots when activeScene changes
  const fetchHotspotsForScene = async () => {
    if (!activeScene?._id) return;
    try {
      setIsTransitioning(true);
      setLoadingMessage(`Warping to ${activeScene.name}...`);
      
      const { data } = await axios.get(`http://localhost:5000/api/hotspots/scene/${activeScene._id}`);
      setHotspots(data);
      
      // Delay transitions slightly to allow texture rendering
      setTimeout(() => {
        setIsTransitioning(false);
      }, 450);
    } catch (err) {
      console.error("Failed to load hotspots:", err);
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    fetchHotspotsForScene();
  }, [activeScene]);

  // 4. Handle teleports to connected rooms
  const handleTeleport = (roomName) => {
    const nextScene = scenes.find(s => s.name.toLowerCase() === roomName.toLowerCase());
    if (nextScene) {
      playSound('teleport');
      setActiveScene(nextScene);
      setSelectedProduct(null);
      setPendingClickCoords(null);
      setIsCategoriesDrawerOpen(false);
      
      // Play room greeting announcement
      const announcement = `Entering the ${nextScene.name}.`;
      speakText(announcement);
    } else {
      console.warn(`Scene named "${roomName}" not found.`);
    }
  };

  // 5. Add to Cart integration
  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    playSound('cart');
    setToastMessage(`Added ${product.name} to cart!`);
    speakText(`${product.name} added to cart.`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // 6. Search Inside VR functionality
  const handleSearchInsideVR = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    
    // Find matching product hotspot in CURRENT scene
    const match = hotspots.find(h => 
      h.type === "product" && 
      h.productId && 
      (h.productId.name.toLowerCase().includes(query) || 
       h.productId.brand?.toLowerCase().includes(query) ||
       h.productId.category?.toLowerCase().includes(query))
    );

    if (match) {
      // 1. Target camera angles to look directly at it
      setLookAtCoords({ pitch: match.pitch, yaw: match.yaw });
      setHighlightedHotspotId(match._id);
      speakText(`Found product ${match.productId.name}.`);
      playSound('click');

      // Clear coords lock after 1.5s so OrbitControls releases camera control
      setTimeout(() => {
        setLookAtCoords(null);
      }, 1500);

      // Reset pulse highlight after 4s
      setTimeout(() => {
        setHighlightedHotspotId(null);
      }, 4000);
    } else {
      // Search in OTHER scenes
      const sceneWithMatch = scenes.find(s => {
        const categoryMatch = s.name.toLowerCase().includes(query);
        return categoryMatch;
      });

      if (sceneWithMatch) {
        if (window.confirm(`Found matching department "${sceneWithMatch.name}". Would you like to teleport there?`)) {
          handleTeleport(sceneWithMatch.name);
        }
      } else {
        alert(`Product containing "${searchQuery}" not found in this department. Try searching another term.`);
      }
    }
  };

  // Theme styling based on room name
  const currentThemeColor = useMemo(() => {
    if (!activeScene) return "#3b82f6";
    const name = activeScene.name.toLowerCase();
    if (name.includes("lobby")) return "#3b82f6"; // blue
    if (name.includes("kids")) return "#ec4899"; // pink
    if (name.includes("fashion") || name.includes("boutique")) return "#a855f7"; // purple
    if (name.includes("tech") || name.includes("electronics")) return "#06b6d4"; // cyan
    return "#10b981"; // green
  }, [activeScene]);

  return (
    <div className="w-screen h-screen relative bg-black overflow-hidden font-sans select-none">
      
      {/* Screen Loader when transitioning */}
      {isTransitioning && <SceneLoader message={loadingMessage} />}

      {/* Floating Cart Toast Notification */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 bg-zinc-950/95 border border-emerald-500/50 backdrop-blur-2xl px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">🛒</span>
          <p className="text-white text-sm font-bold tracking-wide">{toastMessage}</p>
        </div>
      )}

      {/* Dynamic Header Info Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 md:p-6 text-white bg-gradient-to-b from-black/80 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-wider flex items-center gap-2">
            <span className="text-purple-400">🥽</span> VIRTUAL SHOPPING EXPERIENCE
          </h1>
          {activeScene && (
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Department: {activeScene.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Floating Top Navigation Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <form onSubmit={handleSearchInsideVR} className="flex bg-zinc-950/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl pointer-events-auto">
          <input
            type="text"
            placeholder="Search in room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent px-3.5 py-2 text-xs text-white outline-none w-40 md:w-56 font-medium"
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 font-bold text-xs tracking-wider transition-colors cursor-pointer"
          >
            Find
          </button>
        </form>

        {isAdminUser && (
          <button 
            onClick={() => {
              playSound('click');
              setIsAdminEditorOpen(!isAdminEditorOpen);
            }}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black tracking-wider transition pointer-events-auto cursor-pointer ${
              isAdminEditorOpen 
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 border border-emerald-400' 
                : 'bg-zinc-950/90 border border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {isAdminEditorOpen ? '🛠️ CLOSE ADMIN' : '🛠️ VR ADMIN'}
          </button>
        )}
      </div>

      {/* Floating Center Categories Drawer/Modal */}
      {isCategoriesDrawerOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-3xl rounded-3xl p-6 md:p-8 text-white shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => {
                playSound('click');
                setIsCategoriesDrawerOpen(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full flex items-center justify-center font-bold transition cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl font-black tracking-wider text-white">VIRTUAL SHOWROOMS</h3>
              <p className="text-zinc-400 text-xs mt-1">Select a department store below to teleport instantly in 360°</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categoryScenes.map((cat) => {
                // Find if the scene actually exists in DB
                const exists = scenes.some(s => s.name.toLowerCase() === cat.sceneName.toLowerCase());
                return (
                  <div
                    key={cat.name}
                    onClick={() => exists && handleTeleport(cat.sceneName)}
                    className={`relative rounded-2xl border p-5 flex flex-col justify-between h-32 transition duration-200 bg-gradient-to-br ${cat.gradient} select-none group ${
                      exists ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg' : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-2xl">{cat.icon}</div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{cat.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {exists ? "Teleport Now" : "Coming Soon"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Immersive Glassmorphic Floating Bottom HUD Menu */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 w-[95%] max-w-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-2xl rounded-2xl p-2.5 shadow-2xl flex items-center justify-around gap-2 pointer-events-auto">
        {/* Lobby / Home Button */}
        <button
          onClick={() => handleTeleport("Lobby")}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            activeScene?.name === "Lobby" ? "text-indigo-400" : "text-zinc-400 hover:text-white"
          }`}
        >
          <span className="text-lg">🏢</span>
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Lobby</span>
        </button>

        {/* Categories Drawer Button */}
        <button
          onClick={() => {
            playSound('click');
            setIsCategoriesDrawerOpen(true);
          }}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer`}
        >
          <span className="text-lg">🛍️</span>
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Departments</span>
        </button>

        {/* MiniMap Toggle */}
        <button
          onClick={() => {
            playSound('click');
            setIsMapOpen(!isMapOpen);
          }}
          className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            isMapOpen ? "text-indigo-400" : "text-zinc-400 hover:text-white"
          }`}
        >
          <span className="text-lg">🗺️</span>
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Map</span>
        </button>

        {/* Cart Quick-Link */}
        <button
          onClick={() => navigate('/cart')}
          className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer relative"
        >
          <span className="text-lg">🛒</span>
          {cartItemCount > 0 && (
            <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center border border-black animate-pulse">
              {cartItemCount}
            </span>
          )}
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Cart</span>
        </button>

        {/* Wishlist Link */}
        <button
          onClick={() => navigate('/wishlist')}
          className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
        >
          <span className="text-lg">❤️</span>
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Wishlist</span>
        </button>

        <div className="w-[1px] h-6 bg-zinc-800/80 mx-1" />

        {/* Exit Store */}
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl transition text-rose-400 hover:text-rose-300 cursor-pointer"
        >
          <span className="text-lg">🚪</span>
          <span className="text-[9px] font-black tracking-wider uppercase mt-1">Exit</span>
        </button>
      </div>

      {/* Interactive 3D Canvas Panorama Viewer */}
      {activeScene && (
        <PanoramaViewer
          activeScene={activeScene}
          hotspots={hotspots}
          onHotspotClick={(prod) => {
            playSound('click');
            setSelectedProduct(prod);
          }}
          onTeleportClick={handleTeleport}
          isEditingHotspots={isAdminEditorOpen}
          onVisualPlacement={(pitch, yaw) => {
            playSound('click');
            setPendingClickCoords({ pitch, yaw });
          }}
          lookAtCoords={lookAtCoords}
          highlightedHotspotId={highlightedHotspotId}
          activeColor={currentThemeColor}
        />
      )}

      {/* Floating Store Mini Map */}
      <MiniMap 
        scenes={scenes}
        activeScene={activeScene}
        onJump={handleTeleport}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        activeColor={currentThemeColor}
      />

      {/* Product Detailed Card Popup */}
      {selectedProduct && (
        <ProductPopup 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          activeColor={currentThemeColor}
        />
      )}

      {/* Admin Visual VR Editor Panel */}
      {isAdminEditorOpen && (
        <AdminVRPanel 
          scenes={scenes}
          activeScene={activeScene}
          onRefreshScenes={fetchScenes}
          hotspots={hotspots}
          onRefreshHotspots={fetchHotspotsForScene}
          pendingClickCoords={pendingClickCoords}
          onClearPendingCoords={() => setPendingClickCoords(null)}
          onJumpRoom={handleTeleport}
        />
      )}

    </div>
  );
};

export default VirtualShowroom;
