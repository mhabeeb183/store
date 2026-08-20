import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const API = "http://localhost:5000/api/warehouses";

const WarehouseManagement = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  const [warehouses, setWarehouses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: { address: "", city: "", state: "", country: "", zipCode: "" },
    capacity: 1000,
    status: "active",
  });

  const [stockForm, setStockForm] = useState({
    warehouseId: "",
    productId: "",
    quantity: 0,
    bin: "A1",
  });

  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    productId: "",
    quantity: 0,
  });

  const [activeTab, setActiveTab] = useState("warehouses");

  useEffect(() => {
    fetchWarehouses();
    fetchAnalytics();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data } = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarehouses(data.warehouses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(`${API}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data.analytics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setForm({
        name: "",
        location: { address: "", city: "", state: "", country: "", zipCode: "" },
        capacity: 1000,
        status: "active",
      });
      fetchWarehouses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating warehouse");
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/${stockForm.warehouseId}/add-stock`,
        {
          productId: stockForm.productId,
          quantity: Number(stockForm.quantity),
          bin: stockForm.bin,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Stock added!");
      fetchWarehouses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding stock");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/transfer`, transferForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Transfer successful!");
      fetchWarehouses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Transfer failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warehouse?")) return;
    try {
      await axios.delete(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWarehouses();
      fetchAnalytics();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        🏭 Warehouse Management
      </h1>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Warehouses", value: analytics.totalWarehouses, color: "#3b82f6" },
            { label: "Active", value: analytics.activeWarehouses, color: "#10b981" },
            { label: "Total Capacity", value: analytics.totalCapacity, color: "#8b5cf6" },
            { label: "Current Stock", value: analytics.totalCurrentStock, color: "#f59e0b" },
            { label: "Utilization", value: analytics.utilizationRate, color: "#ef4444" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-md border-l-4" style={{ borderLeftColor: card.color }}>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {["warehouses", "addStock", "transfer"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer text-sm sm:text-base ${
              activeTab === tab 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-gray-155 bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab === "warehouses" ? "📦 Warehouses" : tab === "addStock" ? "➕ Add Stock" : "🔄 Transfer"}
          </button>
        ))}
      </div>

      {/* Warehouses Tab */}
      {activeTab === "warehouses" && (
        <>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer mb-6 transition-colors text-sm sm:text-base shadow-sm"
          >
            {showForm ? "Cancel" : "+ Create Warehouse"}
          </button>

          {showForm && (
            <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl mb-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="Warehouse Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="p-3 border border-gray-350 border-gray-350 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
                <input placeholder="Address" value={form.location.address} onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })} required className="p-3 border border-gray-350 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
                <input placeholder="City" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} required className="p-3 border border-gray-350 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
                <input placeholder="Country" value={form.location.country} onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })} required className="p-3 border border-gray-350 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
                <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="p-3 border border-gray-350 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
              </div>
              <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold cursor-pointer transition-colors shadow-sm">Create</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((wh) => (
              <div key={wh._id} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow flex flex-col justify-between gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{wh.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">📍 {wh.location?.city}, {wh.location?.country}</p>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p>Capacity: <span className="font-semibold">{wh.currentStock}/{wh.capacity}</span></p>
                      <p>Status: <span className={`font-semibold ${wh.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>{wh.status}</span></p>
                      <p className="text-xs text-gray-400 mt-2">{wh.products?.length || 0} product types stored</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(wh._id)} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors text-sm w-full sm:w-auto text-center shadow-sm">Delete</button>
                </div>
              </div>
            ))}
            {warehouses.length === 0 && <p className="col-span-full text-gray-400 text-center py-12">No warehouses found</p>}
          </div>
        </>
      )}

      {/* Add Stock Tab */}
      {activeTab === "addStock" && (
        <form onSubmit={handleAddStock} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-gray-850 mb-6 text-gray-800">Add Stock to Warehouse</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full bg-white">
              <option value="">Select Warehouse</option>
              {warehouses.map((wh) => (<option key={wh._id} value={wh._id}>{wh.name}</option>))}
            </select>
            <input placeholder="Product ID" value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
            <input type="number" placeholder="Quantity" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
            <input placeholder="Bin Location" value={stockForm.bin} onChange={(e) => setStockForm({ ...stockForm, bin: e.target.value })} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
          </div>
          <button type="submit" className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition-colors shadow-sm">Add Stock</button>
        </form>
      )}

      {/* Transfer Tab */}
      {activeTab === "transfer" && (
        <form onSubmit={handleTransfer} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-gray-850 mb-6 text-gray-800">Transfer Stock Between Warehouses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full bg-white">
              <option value="">From Warehouse</option>
              {warehouses.map((wh) => (<option key={wh._id} value={wh._id}>{wh.name}</option>))}
            </select>
            <select value={transferForm.toWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full bg-white">
              <option value="">To Warehouse</option>
              {warehouses.map((wh) => (<option key={wh._id} value={wh._id}>{wh.name}</option>))}
            </select>
            <input placeholder="Product ID" value={transferForm.productId} onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
            <input type="number" placeholder="Quantity" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full" />
          </div>
          <button type="submit" className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-semibold cursor-pointer transition-colors shadow-sm">Transfer</button>
        </form>
      )}
    </div>
  );
};

export default WarehouseManagement;
