import React, { useEffect, useState } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";
import { useToast } from "../context/ToastContext.jsx";

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlans();
    if (token) fetchWallet();
  }, [token]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans");
      if (!res.ok) throw new Error("Could not load plans.");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Fetch Plans Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (error) {
      console.error("Fetch Wallet Error:", error);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!token) {
      showToast("Please log in to purchase a subscription.", "warning");
      return;
    }

    setMessage("");
    setErrorMsg("");
    setProcessingPlanId(plan._id);

    try {
      // Step 1: Request purchase configuration details from server
      const res = await fetch("/api/subscriptions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan._id, useWallet }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to check out subscription.");
      }

      const data = await res.json();

      // Step 2a: Wallet covers full balance amount
      if (data.paymentType === "wallet") {
        await activateSubscription(plan._id, data.walletUsed);
        return;
      }

      // Step 2b: Razorpay needed (simulated for simplicity)
      const walletUsed = data.walletUsed || 0;
      const amountToPay = data.amountToPay;

      // Simulated payment callback delay for user interface demo
      setTimeout(async () => {
        try {
          await activateSubscription(plan._id, walletUsed);
          setMessage(`✅ Subscription Activated!\nPaid via simulated payment: ₹${amountToPay}${walletUsed > 0 ? ` (+ ₹${walletUsed} from wallet)` : ""}`);
        } catch (err) {
          setErrorMsg(err.message);
        }
      }, 1000);

    } catch (error) {
      setErrorMsg(error.message);
      setProcessingPlanId(null);
    }
  };

  const activateSubscription = async (planId, walletUsed = 0) => {
    try {
      const res = await fetch("/api/subscriptions/activate-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, walletUsed }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to activate subscription.");
      }

      setMessage("🎉 Congratulations! Your subscription has been successfully activated.");
      fetchWallet();
      setProcessingPlanId(null);
    } catch (error) {
      setErrorMsg(error.message);
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="mt-4 text-zinc-500 font-semibold text-sm">Loading subscription plans...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block">
            👑 Member Benefits
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-800 tracking-tight mt-3">
            FreshCart Premium Plans
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mt-2 font-medium">
            Subscribe to secure unlimited free deliveries, premium early-access flash deals, and priority support!
          </p>
        </div>

        {/* User wallet panel */}
        {token && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shadow-xl shadow-emerald-500/10">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wide">💳 Current Wallet Balance</p>
              <h2 className="text-2xl sm:text-3xl font-black mt-1">RS {walletBalance.toFixed(2)}</h2>
            </div>
            <label className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={useWallet}
                onChange={() => setUseWallet(!useWallet)}
                className="w-4.5 h-4.5 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold">Use Wallet Contribution</span>
            </label>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm font-bold mb-6 shadow-sm">
            {message}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-sm font-bold mb-6 shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* Grid display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const isProcessing = processingPlanId === plan._id;
            const coversAll = useWallet && walletBalance >= plan.price;
            const hasPartial = useWallet && walletBalance > 0 && walletBalance < plan.price;
            const remaining = hasPartial ? plan.price - walletBalance : plan.price;

            return (
              <div
                key={plan._id}
                className={`bg-white border rounded-3xl p-8 flex flex-col justify-between relative transition duration-300 hover:shadow-xl shadow-sm ${
                  index === 1 ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200/60"
                }`}
              >
                {index === 1 && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    ⭐ Recommended Best Value
                  </span>
                )}

                <div>
                  <h3 className="font-black text-xl text-zinc-800 leading-tight mb-2">{plan.name}</h3>
                  <div className="mb-6 flex items-baseline">
                    <span className="text-3xl font-black text-emerald-600 leading-none">RS {plan.price}</span>
                    <span className="text-zinc-400 text-xs font-semibold ml-1">/ {plan.duration} days</span>
                  </div>

                  <ul className="text-xs font-semibold text-zinc-600 space-y-3.5 mb-8 border-t border-zinc-100 pt-6">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 text-base">✓</span>
                      Unlimited Free Shipping
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 text-base">✓</span>
                      Exclusive Member Coupons
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 text-base">✓</span>
                      24/7 Support Callback
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isProcessing}
                  className={`w-full text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 ${
                    index === 1 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-800 hover:bg-zinc-900"
                  }`}
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : coversAll ? (
                    "Pay with Wallet"
                  ) : hasPartial ? (
                    `Pay RS ${remaining.toFixed(2)} + Wallet`
                  ) : (
                    "Pay with Razorpay"
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionPage;
