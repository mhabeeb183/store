import React, { useState, useEffect } from 'react';
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
    
    if (type === 'save') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'delete') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {}
};

const AdminVRPanel = ({ 
  scenes, 
  activeScene, 
  onRefreshScenes, 
  hotspots, 
  onRefreshHotspots, 
  pendingClickCoords, // { pitch, yaw } passed from sphere double-click
  onClearPendingCoords,
  onJumpRoom
}) => {
  const [products, setProducts] = useState([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEditingHotspots, setIsEditingHotspots] = useState(false);
  
  // Create Room Form State
  const [newRoomName, setNewRoomName] = useState("");
  const [newPanoramaUrl, setNewPanoramaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Add Hotspot Form State
  const [hotspotType, setHotspotType] = useState("product");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedTargetSceneId, setSelectedTargetSceneId] = useState("");
  const [hotspotLabel, setHotspotLabel] = useState("");

  const [token, setToken] = useState("");

  // 1. Check user token
  useEffect(() => {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      setToken(userInfo.token);
      // Only enable admin controls if user has admin role
      const role = userInfo.user?.role || userInfo.role;
      if (role === "admin") {
        setIsAdminMode(true);
      }
    }
  }, []);

  // 2. Fetch all products (for hotspot product search)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/products");
        setProducts(data);
        if (data.length > 0) setSelectedProductId(data[0]._id);
      } catch (err) {
        console.error("Failed to fetch products for admin panel:", err);
      }
    };
    if (isAdminMode) {
      fetchProducts();
    }
  }, [isAdminMode]);

  // Set default target scene when scenes list changes
  useEffect(() => {
    const firstOtherScene = scenes.find(s => s._id !== activeScene?._id);
    if (firstOtherScene) setSelectedTargetSceneId(firstOtherScene._id);
  }, [scenes, activeScene]);

  // 3. Handle File Upload (VRTour Panorama)
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const { data } = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setNewPanoramaUrl(data.imageUrl);
      setUploading(false);
    } catch (err) {
      console.error("Panorama upload failed:", err);
      alert("Failed to upload panorama.");
      setUploading(false);
    }
  };

  // 4. Create Scene (Room)
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName || !newPanoramaUrl) {
      alert("Please fill in room name and upload/enter a panorama URL.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/scenes",
        {
          name: newRoomName,
          panoramaUrl: newPanoramaUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      playSound('save');
      setNewRoomName("");
      setNewPanoramaUrl("");
      onRefreshScenes();
      alert("Department created successfully!");
    } catch (err) {
      console.error("Failed to create room:", err);
      alert(err.response?.data?.message || "Failed to create room.");
    }
  };

  // 5. Connect Rooms
  const handleConnectRooms = async (targetId) => {
    if (!activeScene) return;
    try {
      // Add connection symmetrically
      const currentConnections = activeScene.connections.map(c => c._id);
      if (currentConnections.includes(targetId)) {
        alert("Passage already connected!");
        return;
      }
      
      const newConnections = [...currentConnections, targetId];

      await axios.put(
        `http://localhost:5000/api/scenes/${activeScene._id}`,
        { connections: newConnections },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Connect back symmetrically
      const targetScene = scenes.find(s => s._id === targetId);
      const targetConnections = targetScene.connections ? targetScene.connections.map(c => c._id) : [];
      if (!targetConnections.includes(activeScene._id)) {
        await axios.put(
          `http://localhost:5000/api/scenes/${targetId}`,
          { connections: [...targetConnections, activeScene._id] },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      playSound('save');
      onRefreshScenes();
      alert("Rooms connected symmetrically!");
    } catch (err) {
      console.error("Failed to connect rooms:", err);
      alert("Failed to connect rooms.");
    }
  };

  // 6. Delete Scene
  const handleDeleteRoom = async (sceneId) => {
    if (!window.confirm("Are you sure you want to delete this department? All associated hotspots will be lost.")) return;

    try {
      await axios.delete(`http://localhost:5000/api/scenes/${sceneId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      playSound('delete');
      onRefreshScenes();
      onJumpRoom("Lobby"); // Jump back to Lobby
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Failed to delete department.");
    }
  };

  // 7. Add Hotspot (using Visual double-click coordinates)
  const handleAddHotspot = async (e) => {
    e.preventDefault();
    if (!activeScene || !pendingClickCoords) return;

    try {
      const payload = {
        sceneId: activeScene._id,
        pitch: pendingClickCoords.pitch,
        yaw: pendingClickCoords.yaw,
        type: hotspotType,
        label: hotspotLabel,
      };

      if (hotspotType === "product") {
        payload.productId = selectedProductId;
      } else {
        payload.targetSceneId = selectedTargetSceneId;
      }

      await axios.post("http://localhost:5000/api/hotspots", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      playSound('save');
      setHotspotLabel("");
      onClearPendingCoords();
      onRefreshHotspots();
      alert("Hotspot placed successfully!");
    } catch (err) {
      console.error("Failed to save hotspot:", err);
      alert(err.response?.data?.message || "Failed to save hotspot.");
    }
  };

  // 8. Delete Hotspot
  const handleDeleteHotspot = async (hotspotId) => {
    if (!window.confirm("Delete this hotspot?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/hotspots/${hotspotId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      playSound('delete');
      onRefreshHotspots();
    } catch (err) {
      console.error("Failed to delete hotspot:", err);
      alert("Failed to delete hotspot.");
    }
  };

  if (!isAdminMode) return null;

  return (
    <div className="absolute top-28 left-6 z-25 w-80 max-h-[75vh] bg-zinc-950/90 border border-zinc-900/90 backdrop-blur-2xl p-5 rounded-2xl shadow-2xl text-white overflow-y-auto scrollbar-none flex flex-col gap-5">
      <div>
        <h2 className="text-xs font-black tracking-widest text-emerald-400 border-b border-zinc-900 pb-2 flex items-center justify-between">
          <span>🛠️ ADMIN VR EDITOR</span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded text-[8px]">ACTIVE</span>
        </h2>
      </div>

      {/* Toggle Hotspot Edit Mode */}
      <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
        <div className="text-xs">
          <p className="font-bold text-zinc-200">Interactive Hotspots</p>
          <p className="text-[10px] text-zinc-500">Visual authoring mode</p>
        </div>
        <button
          onClick={() => setIsEditingHotspots(!isEditingHotspots)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            isEditingHotspots
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/50'
          }`}
        >
          {isEditingHotspots ? "EDIT ON" : "EDIT OFF"}
        </button>
      </div>

      {isEditingHotspots && (
        <div className="bg-emerald-950/20 border border-emerald-500/25 p-3.5 rounded-xl text-[10px] text-emerald-400 leading-normal">
          💡 <strong>VISUAL PLACEMENT INSTRUCTIONS:</strong>
          <br />
          1. Close this editor panel temporarily if needed.
          <br />
          2. Look around the room and <strong>double-click</strong> anywhere on the shelves, tables, or walls.
          <br />
          3. Fill out the form that opens below to bind a product or teleport ring to that spot.
        </div>
      )}

      {/* Visual Placement Form (Saves double-clicked hotspot) */}
      {isEditingHotspots && pendingClickCoords && (
        <form onSubmit={handleAddHotspot} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] border-b border-zinc-800 pb-1.5">
            <span className="font-bold text-cyan-400">📍 Placed Ray coords:</span>
            <button 
              type="button" 
              onClick={onClearPendingCoords}
              className="text-zinc-500 hover:text-white font-bold"
            >
              Cancel
            </button>
          </div>
          
          <div className="text-[8px] text-zinc-500 flex justify-between">
            <span>Pitch: {pendingClickCoords.pitch.toFixed(3)} rad</span>
            <span>Yaw: {pendingClickCoords.yaw.toFixed(3)} rad</span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Hotspot Type</label>
            <select
              value={hotspotType}
              onChange={(e) => setHotspotType(e.target.value)}
              className="bg-black border border-zinc-800 text-xs p-2 rounded-lg outline-none text-zinc-300"
            >
              <option value="product">🛍️ Product Hotspot</option>
              <option value="teleport">🚪 Teleport Ring</option>
            </select>
          </div>

          {hotspotType === "product" ? (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-black border border-zinc-800 text-xs p-2 rounded-lg outline-none text-zinc-300 max-w-full"
              >
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase">Target Department</label>
              <select
                value={selectedTargetSceneId}
                onChange={(e) => setSelectedTargetSceneId(e.target.value)}
                className="bg-black border border-zinc-800 text-xs p-2 rounded-lg outline-none text-zinc-300"
              >
                {scenes.filter(s => s._id !== activeScene?._id).map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Display Label</label>
            <input
              type="text"
              placeholder="e.g. Teleport to Tech, Featured Shoes"
              value={hotspotLabel}
              onChange={(e) => setHotspotLabel(e.target.value)}
              className="bg-black border border-zinc-800 text-xs p-2 rounded-lg outline-none text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer mt-1"
          >
            Save Hotspot
          </button>
        </form>
      )}

      {/* List Existing Hotspots for Deletion */}
      {isEditingHotspots && hotspots.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Hotspots in Room:</h3>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {hotspots.map(h => (
              <div key={h._id} className="flex justify-between items-center bg-black/40 border border-zinc-900 p-2 rounded-xl text-[9px]">
                <span className="truncate max-w-[140px] text-zinc-300">
                  {h.type === "product" ? `🛍️ ${h.productId?.name}` : `🚪 Teleport to: ${h.targetSceneId?.name}`}
                </span>
                <button 
                  onClick={() => handleDeleteHotspot(h._id)}
                  className="text-rose-500 hover:text-rose-400 font-bold border border-rose-950 px-2 py-0.5 rounded hover:bg-rose-950/20"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scene (Room) Creators */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col gap-4">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Create Department Room</h3>
        
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Room Name</label>
            <input
              type="text"
              placeholder="e.g. Grocery, Sports"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="bg-black border border-zinc-800 text-xs p-2 rounded-lg outline-none text-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase">Panorama Image File</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadFile}
                className="hidden"
                id="panorama-file-input"
              />
              <label 
                htmlFor="panorama-file-input"
                className="flex-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 py-2 px-3 rounded-lg text-center text-xs text-zinc-300 cursor-pointer font-semibold border-dashed"
              >
                {uploading ? "Uploading..." : "Choose 360 JPG"}
              </label>
            </div>
            {newPanoramaUrl && (
              <p className="text-[8px] text-emerald-400 truncate mt-1">Uploaded: {newPanoramaUrl}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            Create Department
          </button>
        </form>
      </div>

      {/* Connect Rooms Form */}
      {activeScene && scenes.length > 1 && (
        <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Connect Aisle Passages</h3>
          <div className="flex flex-col gap-2 text-[10px]">
            <p className="text-zinc-500">Connect a doorway from <strong>{activeScene.name}</strong> to:</p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {scenes.filter(s => s._id !== activeScene._id).map(s => {
                const isConnected = activeScene.connections?.some(c => c._id === s._id || c === s._id);
                return (
                  <div key={s._id} className="flex justify-between items-center bg-black/40 border border-zinc-900 p-2 rounded-xl">
                    <span className="text-zinc-300">{s.name}</span>
                    {isConnected ? (
                      <span className="text-emerald-400 text-[8px] font-bold border border-emerald-950 px-1.5 py-0.5 rounded bg-emerald-950/20">CONNECTED</span>
                    ) : (
                      <button
                        onClick={() => handleConnectRooms(s._id)}
                        className="text-blue-400 hover:text-blue-300 font-bold border border-blue-950 px-2.5 py-0.5 rounded hover:bg-blue-950/20 cursor-pointer"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Departments */}
      {scenes.length > 0 && (
        <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Manage Departments</h3>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {scenes.map(s => (
              <div key={s._id} className="flex justify-between items-center bg-black/40 border border-zinc-900 p-2 rounded-xl text-[9px]">
                <span className="text-zinc-300 font-semibold">{s.name}</span>
                <button 
                  onClick={() => handleDeleteRoom(s._id)}
                  className="text-rose-500 hover:text-rose-400 font-bold border border-rose-950 px-2 py-0.5 rounded hover:bg-rose-950/20"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVRPanel;
