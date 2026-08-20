import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { loadRazorpay } from "../utils/razorpay";

const API = "http://localhost:5000/api";

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  useEffect(() => {
    fetchPlans();
    if (token) fetchWallet();
  }, [token]);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get(`${API}/subscriptions/plans`);
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Fetch Plans Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data } = await axios.get(`${API}/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWalletBalance(data.walletBalance || 0);
    } catch (error) {
      console.error("Fetch Wallet Error:", error);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!token) {
      alert("Please login to subscribe.");
      return;
    }

    setProcessingPlanId(plan._id);

    try {
      // Step 1: Call purchase endpoint to get payment info
      const { data } = await axios.post(
        `${API}/subscriptions/purchase`,
        { planId: plan._id, useWallet },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2a: Wallet covers the full amount
      if (data.paymentType === "wallet") {
        await activateWithWallet(plan._id);
        return;
      }

      // Step 2b: Razorpay needed for full or remaining amount
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        return;
      }

      const razorpayOrder = data.razorpayOrder;
      const walletUsed = data.walletUsed || 0;
      const amountToPay = data.amountToPay;

      if (!razorpayOrder) {
        alert("Failed to create payment order. Please try again.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Global E-Commerce",
        description: `${plan.name} Subscription`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            // Step 3: Deduct wallet portion if used, then activate
            if (walletUsed > 0) {
              await axios.post(
                `${API}/wallet/use-wallet`,
                { amount: walletUsed },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            // Step 4: Activate the subscription
            await axios.post(
              `${API}/subscriptions/activate-wallet`,
              { planId: plan._id },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            alert(
              `✅ Subscription Activated!\nPlan: ${plan.name}\nWallet Used: ₹${walletUsed}\nPaid via Razorpay: ₹${amountToPay}`
            );
            fetchWallet();
            fetchPlans();
          } catch (err) {
            alert(err.response?.data?.message || "Subscription activation failed after payment.");
          }
        },
        prefill: {
          name: userInfo?.name || "",
          email: userInfo?.email || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      alert(error.response?.data?.message || "Subscription Purchase Failed");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const activateWithWallet = async (planId) => {
    try {
      await axios.post(
        `${API}/subscriptions/activate-wallet`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Subscription Activated using Wallet!");
      fetchWallet();
      fetchPlans();
    } catch (error) {
      alert(error.response?.data?.message || "Wallet activation failed.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ fontSize: "20px", color: "#6b7280" }}>Loading Subscription Plans...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "8px" }}>
          🎯 Subscription Plans
        </h1>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>
          Get unlimited free delivery and exclusive member benefits
        </p>
      </div>

      {/* Wallet Section */}
      {token && (
        <div
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            borderRadius: "16px",
            padding: "20px 28px",
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}
        >
          <div>
            <p style={{ opacity: 0.85, fontSize: "14px", marginBottom: "4px" }}>
              💳 Your Wallet Balance
            </p>
            <p style={{ fontSize: "28px", fontWeight: "800" }}>₹{walletBalance.toFixed(2)}</p>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              background: "rgba(255,255,255,0.15)",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            <input
              type="checkbox"
              checked={useWallet}
              onChange={() => setUseWallet(!useWallet)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontWeight: "600", fontSize: "15px" }}>
              Use Wallet Balance
            </span>
          </label>
        </div>
      )}

      {/* Payment Info Banner */}
      {useWallet && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "14px 20px",
            marginBottom: "28px",
            color: "#166534",
            fontSize: "14px",
          }}
        >
          ✅ Wallet will be applied first. Any remaining amount will be paid via Razorpay.
        </div>
      )}

      {!useWallet && token && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "14px 20px",
            marginBottom: "28px",
            color: "#1e40af",
            fontSize: "14px",
          }}
        >
          💳 Full amount will be paid via Razorpay. Enable "Use Wallet Balance" to apply your wallet first.
        </div>
      )}

      {/* Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {plans.map((plan, index) => {
          const isProcessing = processingPlanId === plan._id;
          const walletCoversAll = useWallet && walletBalance >= plan.price;
          const walletPartial = useWallet && walletBalance > 0 && walletBalance < plan.price;
          const remaining = walletPartial ? plan.price - walletBalance : 0;

          return (
            <div
              key={plan._id}
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "32px 28px",
                boxShadow: index === 1
                  ? "0 16px 48px rgba(99,102,241,0.25)"
                  : "0 4px 16px rgba(0,0,0,0.08)",
                border: index === 1 ? "2px solid #6366f1" : "2px solid #f3f4f6",
                position: "relative",
                transition: "transform 0.2s",
              }}
            >
              {/* Popular Badge */}
              {index === 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff",
                    padding: "6px 20px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                  }}
                >
                  ⭐ MOST POPULAR
                </div>
              )}

              {/* Plan Name */}
              <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>
                {plan.name}
              </h2>

              {/* Price */}
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "40px", fontWeight: "900", color: "#6366f1" }}>
                  ₹{plan.price}
                </span>
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                  {" "}/ {plan.duration} days
                </span>
              </div>

              {/* Features */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#10b981", fontSize: "18px" }}>✓</span>
                  Unlimited Free Delivery
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    borderBottom: "1px solid #f3f4f6",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#10b981", fontSize: "18px" }}>✓</span>
                  Early Access to Deals
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 0",
                    color: "#374151",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "#10b981", fontSize: "18px" }}>✓</span>
                  Priority Customer Support
                </div>
              </div>

              {/* Payment Breakdown */}
              {useWallet && walletBalance > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#166534",
                  }}
                >
                  {walletCoversAll ? (
                    <p>✅ Fully covered by wallet</p>
                  ) : (
                    <>
                      <p>💳 Wallet: ₹{Math.min(walletBalance, plan.price).toFixed(2)}</p>
                      <p>📱 Razorpay: ₹{remaining.toFixed(2)}</p>
                    </>
                  )}
                </div>
              )}

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isProcessing}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  background: isProcessing
                    ? "#9ca3af"
                    : index === 1
                    ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                    : "#1f2937",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  boxShadow: index === 1 ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {isProcessing ? (
                  "Processing..."
                ) : walletCoversAll ? (
                  "✅ Pay with Wallet"
                ) : walletPartial ? (
                  `Pay ₹${remaining.toFixed(2)} via Razorpay + Wallet`
                ) : (
                  "📱 Pay with Razorpay"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <p style={{ fontSize: "48px" }}>📭</p>
          <p style={{ fontSize: "18px" }}>No subscription plans available yet.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
