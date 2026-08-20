import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Stack */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3.5 max-w-sm w-[calc(100vw-3rem)] pointer-events-none">
        {toasts.map((toast) => {
          // Setup style attributes based on message warning types
          let bgClass = "bg-white/95 border-zinc-200/50 text-zinc-800 shadow-zinc-200/40";
          let icon = "✨";
          let barColor = "bg-zinc-400";

          if (toast.type === "success") {
            bgClass = "bg-white/90 border-emerald-100 text-zinc-800 shadow-emerald-500/5 backdrop-blur-md";
            icon = "✅";
            barColor = "bg-emerald-500 shadow-md shadow-emerald-500/40";
          } else if (toast.type === "error") {
            bgClass = "bg-white/90 border-red-100 text-zinc-800 shadow-red-500/5 backdrop-blur-md";
            icon = "❌";
            barColor = "bg-red-500 shadow-md shadow-red-500/40";
          } else if (toast.type === "warning") {
            bgClass = "bg-white/90 border-amber-100 text-zinc-800 shadow-amber-500/5 backdrop-blur-md";
            icon = "⚠️";
            barColor = "bg-amber-500 shadow-md shadow-amber-500/40";
          } else if (toast.type === "info") {
            bgClass = "bg-white/90 border-blue-100 text-zinc-800 shadow-blue-500/5 backdrop-blur-md";
            icon = "ℹ️";
            barColor = "bg-blue-500 shadow-md shadow-blue-500/40";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl border shadow-xl relative overflow-hidden transition-all duration-350 transform translate-x-0 animate-slide-in ${bgClass}`}
              role="alert"
            >
              {/* Colored Side Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`} />

              <span className="text-base select-none">{icon}</span>
              <p className="text-xs font-bold leading-normal flex-1 pr-2 tracking-tight">
                {toast.message}
              </p>
              
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors text-[10px] font-black p-1 hover:bg-zinc-100 rounded-lg cursor-pointer"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
export default ToastContext;
