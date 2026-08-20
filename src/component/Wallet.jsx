import React, { useState, useEffect } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load wallet balance.");
      const data = await res.json();
      setBalance(data.walletBalance || 0);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid positive amount.");
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch("/api/wallet/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountNum }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to load money.");
      }

      const data = await res.json();
      setBalance(data.walletBalance);
      setTopUpAmount("");
      setMessage(`Successfully loaded RS ${amountNum} into your wallet balance!`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="mt-4 text-zinc-500 font-semibold text-sm">Syncing wallet details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Balance display card */}
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-3xl p-8 shadow-xl shadow-emerald-600/20 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-xs font-extrabold uppercase tracking-widest">
                  💳 FreshCart User Balance
                </p>
                <h1 className="text-3xl sm:text-5xl font-black mt-2 leading-none">
                  RS {balance.toFixed(2)}
                </h1>
              </div>
              <span className="text-4xl">💰</span>
            </div>

            <div className="relative z-10 flex gap-4 text-xs font-bold text-emerald-100 border-t border-white/10 pt-4 mt-8">
              <span>💳 Secure & Atomic Payments</span>
              <span>&bull;</span>
              <span>⚡ 5% Cashback Rewards Activated</span>
            </div>
          </div>

          {/* Top up block */}
          <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-200/20">
            <h2 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Add Balance</h2>
            
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold mb-4 shadow-sm">
                {message}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs font-bold mb-4 shadow-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Deposit Amount (INR)
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 500"
                  required
                  min="1"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-xs uppercase tracking-wider shadow-md shadow-emerald-500/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Add Money"}
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wallet;
