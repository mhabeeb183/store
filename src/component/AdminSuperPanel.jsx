import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "./Navabar";
import Footer from "./Footer";

const AdminSuperPanel = () => {
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Plan creation form
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Warehouse creation form
  const [whName, setWhName] = useState("");
  const [whAddress, setWhAddress] = useState("");
  const [whCity, setWhCity] = useState("");
  const [whCountry, setWhCountry] = useState("");
  const [whCapacity, setWhCapacity] = useState("1000");
  const [submittingWh, setSubmittingWh] = useState(false);

  // Stock transfer form
  const [fromWhId, setFromWhId] = useState("");
  const [toWhId, setToWhId] = useState("");
  const [transferProdId, setTransferProdId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferring, setTransferring] = useState(false);

  // Stock restocking form
  const [restockWhId, setRestockWhId] = useState("");
  const [restockProdId, setRestockProdId] = useState("");
  const [restockQty, setRestockQty] = useState("");
  const [restocking, setRestocking] = useState(false);

  const [products, setProducts] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // 1. Fetch vendor requests
      const reqRes = await fetch("/api/vendor/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }

      // 2. Fetch AI recommendation analytics
      const analyticsRes = await fetch("/api/recommendations/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // 3. Fetch warehouses
      const whRes = await fetch("/api/warehouses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWarehouses(whData.warehouses || []);
      }

      // 4. Fetch products
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId, status) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/vendor/request/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reviewNotes: `${status} by Admin` }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to review request.");
      }

      setSuccessMsg(`Vendor request successfully checked: ${status}!`);
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const priceNum = parseFloat(planPrice);
    const durationNum = parseInt(planDuration);

    if (isNaN(priceNum) || isNaN(durationNum) || !planName) {
      setErrorMsg("All fields are required and must be valid numbers.");
      return;
    }

    setSubmittingPlan(true);

    try {
      const res = await fetch("/api/subscriptions/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: planName,
          price: priceNum,
          duration: durationNum,
          freeDelivery: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create plan.");
      }

      setSuccessMsg("Subscription plan package added successfully!");
      setPlanName("");
      setPlanPrice("");
      setPlanDuration("");
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const capNum = parseInt(whCapacity);

    if (!whName || !whAddress || !whCity || !whCountry || isNaN(capNum)) {
      setErrorMsg("All warehouse details are required.");
      return;
    }

    setSubmittingWh(true);

    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: whName,
          location: { address: whAddress, city: whCity, country: whCountry },
          capacity: capNum,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create warehouse.");
      }

      setSuccessMsg("Warehouse logged successfully!");
      setWhName("");
      setWhAddress("");
      setWhCity("");
      setWhCountry("");
      setWhCapacity("1000");
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingWh(false);
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const qtyNum = parseInt(transferQty);

    if (!fromWhId || !toWhId || !transferProdId || isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg("Please select warehouse addresses, items, and quantities.");
      return;
    }

    setTransferring(true);

    try {
      const res = await fetch("/api/warehouses/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromWarehouseId: fromWhId,
          toWarehouseId: toWhId,
          productId: transferProdId,
          quantity: qtyNum,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to transfer stock.");
      }

      setSuccessMsg("Stock transferred successfully between warehouses!");
      setTransferQty("");
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setTransferring(false);
    }
  };

  const handleRestockWarehouse = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const qtyNum = parseInt(restockQty);

    if (!restockWhId || !restockProdId || isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg("Please select warehouse, product and positive quantity.");
      return;
    }

    setRestocking(true);

    try {
      const res = await fetch(`/api/warehouses/${restockWhId}/add-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: restockProdId,
          quantity: qtyNum,
          bin: "A1",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add stock.");
      }

      setSuccessMsg("Stock added successfully to warehouse locations!");
      setRestockQty("");
      fetchAdminData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setRestocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Navbar />
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="mt-4 text-zinc-500 font-semibold text-sm">Synchronizing Admin Panel...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Analytics Chart Data
  const chartData = [
    { name: "Impressions", value: analytics?.totalImpressions || 0 },
    { name: "Clicks", value: analytics?.totalClicks || 0 },
    { name: "Conversions", value: analytics?.totalConversions || 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-12">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full inline-block">
            ⚙️ Super Control
          </span>
          <h1 className="text-3xl font-black text-zinc-850 tracking-tight mt-3">Admin Super Panel</h1>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-sm font-bold shadow-sm">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-sm font-bold shadow-sm">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Vendor Requests */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Vendor Applications</h3>
              <div className="divide-y divide-zinc-150 max-h-60 overflow-y-auto pr-2">
                {requests.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-4 text-center">No pending request applications.</p>
                ) : (
                  requests.map((req) => (
                    <div key={req._id} className="py-3 flex justify-between items-center gap-4 text-xs">
                      <div>
                        <p className="font-extrabold text-zinc-800">{req.businessName}</p>
                        <p className="text-zinc-400 font-semibold mt-0.5">{req.description}</p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1">Applicant: {req.user?.name} ({req.user?.email})</p>
                      </div>
                      <div className="flex gap-2">
                        {req.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleReviewRequest(req._id, "approved")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewRequest(req._id, "rejected")}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            req.status === "approved"
                              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                              : "bg-red-50 border-red-250 text-red-800"
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warehouse Manager logs */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Warehouse logs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {warehouses.length === 0 ? (
                  <p className="text-zinc-400 text-xs py-4 text-center sm:col-span-2">No warehouses mapped yet.</p>
                ) : (
                  warehouses.map((wh) => {
                    const rate = wh.capacity > 0 ? ((wh.currentStock / wh.capacity) * 100).toFixed(1) : 0;
                    return (
                      <div key={wh._id} className="border border-zinc-150 rounded-2xl p-4 text-xs font-semibold text-zinc-500">
                        <div className="flex justify-between items-center mb-2.5">
                          <p className="font-extrabold text-zinc-850 text-sm">{wh.name}</p>
                          <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                            {wh.status}
                          </span>
                        </div>
                        <p className="mb-1">📍 Address: {wh.location?.address}, {wh.location?.city}</p>
                        <p className="mb-2.5">📦 Stock: {wh.currentStock} / {wh.capacity} capacity ({rate}%)</p>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5" style={{ width: `${Math.min(rate, 100)}%` }}></div>
                        </div>

                        {/* Inventory nested */}
                        {wh.products && wh.products.length > 0 && (
                          <div className="mt-3 bg-zinc-50 rounded-xl p-2 text-[10px] space-y-1">
                            <p className="font-extrabold text-zinc-650 uppercase tracking-wider mb-1">Stock Split:</p>
                            {wh.products.map((item, id) => (
                              <p key={id}>&bull; {item.product?.name}: {item.quantity} units (Bin: {item.bin})</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI recommendation analytics report */}
            {analytics && (
              <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-black text-zinc-800 tracking-tight mb-4">Recommendation Analytics</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-50 border p-3 rounded-xl text-center">
                    <p className="text-zinc-400 text-[9px] font-bold uppercase">CTR</p>
                    <p className="text-base font-extrabold text-zinc-800 mt-1">{analytics.clickThroughRate}</p>
                  </div>
                  <div className="bg-zinc-50 border p-3 rounded-xl text-center">
                    <p className="text-zinc-400 text-[9px] font-bold uppercase">Conversion</p>
                    <p className="text-base font-extrabold text-zinc-800 mt-1">{analytics.conversionRate}</p>
                  </div>
                  <div className="bg-zinc-50 border p-3 rounded-xl text-center">
                    <p className="text-zinc-400 text-[9px] font-bold uppercase">Orders Made</p>
                    <p className="text-base font-extrabold text-zinc-800 mt-1">{analytics.totalConversions}</p>
                  </div>
                  <div className="bg-zinc-50 border p-3 rounded-xl text-center">
                    <p className="text-zinc-400 text-[9px] font-bold uppercase">Revenue Generated</p>
                    <p className="text-base font-extrabold text-emerald-600 mt-1">{analytics.revenueGenerated}</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>

          {/* Right Forms Bar */}
          <div className="space-y-8 h-fit">
            
            {/* Create subscription plan package */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black text-zinc-800 mb-3.5">Create Membership Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Plan Package Name</label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Premium Monthly"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Price (INR)</label>
                    <input
                      type="number"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(e.target.value)}
                      placeholder="199"
                      required
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={planDuration}
                      onChange={(e) => setPlanDuration(e.target.value)}
                      placeholder="30"
                      required
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submittingPlan}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  {submittingPlan ? "Creating..." : "Save Plan"}
                </button>
              </form>
            </div>

            {/* Log warehouse facility */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black text-zinc-800 mb-3.5">Log Warehouse Facility</h3>
              <form onSubmit={handleCreateWarehouse} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="e.g. West Warehouse"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    value={whAddress}
                    onChange={(e) => setWhAddress(e.target.value)}
                    placeholder="12 Main St"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">City</label>
                    <input
                      type="text"
                      value={whCity}
                      onChange={(e) => setWhCity(e.target.value)}
                      placeholder="Coimbatore"
                      required
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Country</label>
                    <input
                      type="text"
                      value={whCountry}
                      onChange={(e) => setWhCountry(e.target.value)}
                      placeholder="India"
                      required
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Capacity Units</label>
                  <input
                    type="number"
                    value={whCapacity}
                    onChange={(e) => setWhCapacity(e.target.value)}
                    placeholder="1000"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-emerald-500 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingWh}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  {submittingWh ? "Saving..." : "Save Warehouse"}
                </button>
              </form>
            </div>

            {/* Restock items to warehouse locations */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black text-zinc-800 mb-3.5">Restock Warehouse Stock</h3>
              <form onSubmit={handleRestockWarehouse} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Warehouse Address</label>
                  <select
                    value={restockWhId}
                    onChange={(e) => setRestockWhId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Item Product</label>
                  <select
                    value={restockProdId}
                    onChange={(e) => setRestockProdId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.price})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Quantity Units</label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="e.g. 50"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={restocking}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  {restocking ? "Adding..." : "Add Stock"}
                </button>
              </form>
            </div>

            {/* Warehouse Stock Transfer */}
            <div className="bg-white border border-zinc-200/50 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-black text-zinc-800 mb-3.5">Stock Transfers</h3>
              <form onSubmit={handleTransferStock} className="space-y-3">
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">From Facility</label>
                  <select
                    value={fromWhId}
                    onChange={(e) => setFromWhId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">To Facility</label>
                  <select
                    value={toWhId}
                    onChange={(e) => setToWhId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Item Product</label>
                  <select
                    value={transferProdId}
                    onChange={(e) => setTransferProdId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-[9px] font-bold uppercase mb-1">Quantity Units</label>
                  <input
                    type="number"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    placeholder="e.g. 20"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={transferring}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  {transferring ? "Transferring..." : "Execute Transfer"}
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminSuperPanel;
