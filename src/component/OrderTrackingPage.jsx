import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "./Navabar";
import Footer from "./Footer";

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // 1. Fetch initial order details via HTTP
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/orders/getbyorderid/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load order details.");
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // 2. Establish Socket.IO real-time listener
    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Socket connected for order tracking:", socket.id);
      socket.emit("joinOrder", id);
    });

    socket.on("orderStatusUpdated", (data) => {
      console.log("Received live status update:", data);
      if (data.orderId === id) {
        setOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            orderStatus: data.status,
            statusHistory: data.statusHistory,
          };
        });
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      socket.emit("leaveOrder", id);
      socket.disconnect();
    };
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="mt-4 text-zinc-500 font-semibold text-sm">Loading tracking details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-6 py-16 text-center">
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-xl flex flex-col items-center gap-4">
            <h1 className="text-xl font-black text-red-500">Tracking Error</h1>
            <p className="text-zinc-500 text-sm">{errorMsg || "Order details could not be found."}</p>
            <button
              onClick={() => navigate("/orders")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              Back to Orders
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Predefined tracking timeline statuses
  const statusSteps = [
    { label: "Order Placed", desc: "We received your order" },
    { label: "Packed", desc: "Your items have been packed" },
    { label: "Shipped", desc: "Handed over to carrier" },
    { label: "Out For Delivery", desc: "Delivery partner is on the way" },
    { label: "Delivered", desc: "Delivered to your address" },
  ];

  // Determine current active index
  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.label.toLowerCase() === order.orderStatus.toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/50 shadow-xl shadow-zinc-200/30">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-150 pb-6 mb-8 gap-4">
            <div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                Live Status Enabled
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-800 tracking-tight mt-2">
                Order Tracking
              </h1>
              <p className="text-xs text-zinc-400 font-semibold mt-1">ID: #{order._id}</p>
            </div>
            <div className="text-right sm:text-right">
              <p className="text-xs font-semibold text-zinc-400">Total Price:</p>
              <p className="text-xl font-extrabold text-emerald-600">RS {order.totalAmount?.toFixed(2)}</p>
            </div>
          </div>

          {/* Visual Tracking Progress Timeline */}
          {order.orderStatus === "Cancelled" ? (
            <div className="bg-red-50 border border-red-150 text-red-800 px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-2 mb-8">
              ❌ Order Cancelled (Reason: {order.cancellationReason || "Customer cancelled"})
            </div>
          ) : (
            <div className="relative pl-8 border-l border-zinc-200/80 ml-4 space-y-8 my-8">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                
                // Find timestamp if status exists in order history
                const historyItem = order.statusHistory?.find(
                  (h) => h.status.toLowerCase() === step.label.toLowerCase()
                );

                return (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-emerald-500 border-white text-white shadow-md shadow-emerald-500/20"
                          : "bg-white border-zinc-200 text-zinc-300"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>

                    {/* Step Info */}
                    <div>
                      <h3
                        className={`text-sm sm:text-base font-extrabold ${
                          isCurrent
                            ? "text-emerald-600"
                            : isCompleted
                            ? "text-zinc-800"
                            : "text-zinc-400"
                        }`}
                      >
                        {step.label}
                      </h3>
                      <p className="text-xs text-zinc-400 font-semibold mt-0.5">{step.desc}</p>
                      
                      {historyItem && (
                        <p className="text-[10px] text-zinc-400 font-bold bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-0.5 mt-1.5 inline-block">
                          🕒 {new Date(historyItem.updatedAt).toLocaleTimeString()} &bull; {new Date(historyItem.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery Location Summary */}
          <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl mt-8">
            <h3 className="font-extrabold text-sm text-zinc-700 mb-2.5 uppercase tracking-wide">
              Shipping Summary
            </h3>
            <div className="text-xs space-y-2 text-zinc-500 font-semibold">
              <p>📍 <strong className="text-zinc-700">Address:</strong> {order.shippingAddress}</p>
              <p>📞 <strong className="text-zinc-700">Contact:</strong> {order.contactNumber}</p>
              <p>💳 <strong className="text-zinc-700">Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTrackingPage;
