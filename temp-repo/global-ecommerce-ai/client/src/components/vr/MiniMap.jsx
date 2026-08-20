import React from 'react';

const MiniMap = ({ scenes, activeScene, onJump, isOpen, onClose, activeColor = "#3b82f6" }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-28 right-6 z-25 w-76 bg-zinc-950/80 border border-zinc-900/80 backdrop-blur-2xl p-5 rounded-2xl shadow-2xl text-white animate-scale-up">
      <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2 mb-4">
        <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
          <span>🗺️</span> STORE MINI-MAP
        </h3>
        <button 
          onClick={onClose}
          className="text-zinc-500 hover:text-white font-bold text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Structured Node Layout */}
      <div className="flex flex-col gap-3.5 relative">
        <p className="text-[10px] text-zinc-400 font-bold mb-1">Click a department node to warp instantly:</p>

        {/* Visual Map Layout */}
        <div className="grid grid-cols-3 gap-2 border border-zinc-900 bg-black/40 p-3.5 rounded-xl justify-center items-center min-h-36 relative">
          
          {/* Render rooms dynamically. We map them onto a grid:
              Lobby: middle center (1, 1)
              Tech: top center (0, 1)
              Fashion: middle right (1, 2)
              Kids: middle left (1, 0)
              Others: bottom slots
          */}
          {scenes.map((scene, idx) => {
            const isActive = activeScene?._id === scene._id || activeScene?.name === scene.name;
            const isLobby = scene.name.toLowerCase() === "lobby";
            
            // Map name to a grid position or arrange them list-wise if too many
            let gridClass = "col-span-1";
            if (isLobby) gridClass = "col-start-2 row-start-2";
            
            return (
              <button
                key={scene._id || scene.name}
                onClick={() => {
                  if (!isActive) onJump(scene.name);
                }}
                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase text-center border transition-all cursor-pointer truncate ${
                  isActive
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
                title={scene.name}
              >
                📍 {scene.name === "Lobby" ? "Lobby" : scene.name}
              </button>
            );
          })}
        </div>

        {/* Connections List */}
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-[10px]">
          <p className="font-bold text-zinc-400 uppercase tracking-widest text-[8px] mb-1.5">Connected Passages:</p>
          <div className="flex flex-wrap gap-1">
            {activeScene?.connections && activeScene.connections.length > 0 ? (
              activeScene.connections.map((conn) => (
                <span 
                  key={conn._id || conn.name}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full"
                >
                  🚪 {conn.name}
                </span>
              ))
            ) : (
              <span className="text-zinc-500 italic">No connected passages mapped.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniMap;
