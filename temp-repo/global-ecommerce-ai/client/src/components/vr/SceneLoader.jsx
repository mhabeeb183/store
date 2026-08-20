import React from 'react';

const SceneLoader = ({ message = "Loading Department..." }) => {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex flex-col items-center justify-center text-white animate-fade-in">
      <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-xs text-center">
        {/* Glowing loader ring */}
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
        <h3 className="text-sm font-black tracking-widest text-zinc-400 uppercase">VR STORE</h3>
        <p className="text-zinc-200 text-xs font-bold mt-2 tracking-wide">{message}</p>
        <p className="text-zinc-500 text-[10px] mt-1">Pre-rendering 360° environment...</p>
      </div>
    </div>
  );
};

export default SceneLoader;
