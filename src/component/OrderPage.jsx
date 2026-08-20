import React, { useEffect, useState } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";
import { useSelector } from "react-redux";
import { useToast } from "../context/ToastContext.jsx";

const OrderPage = () => {
  const token = localStorage.getItem("token");
  const { user } = useSelector((state) => state.user);
  const { showToast } = useToast();
  const isAdmin = user?.role === "admin";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // For Admin status update edits
  const [tempStatus, setTempStatus] = useState({});
  const [tempPayment, setTempPayment] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/orders/getorders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch orders.");
      }

      setOrders(data);
      // Initialize local select states
      const initialStatus = {};
      const initialPayment = {};
      data.forEach((ord) => {
        initialStatus[ord._id] = ord.orderStatus;
        initialPayment[ord._id] = ord.paymentStatus;
      });
      setTempStatus(initialStatus);
      setTempPayment(initialPayment);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders. Please make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAdmin]);

  const handleUpdateStatus = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/orders/updateorder/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: tempStatus[orderId],
          paymentStatus: tempPayment[orderId],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update order.");
      }

      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? data : ord))
      );
      showToast("Order updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update order status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChangeDirectly = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const targetOrder = orders.find((o) => o._id === orderId);
      const res = await fetch(`/orders/updateorder/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: newStatus,
          paymentStatus: targetOrder?.paymentStatus || "Pending",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? data : ord))
      );
      showToast("Order status updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update order status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/orders/updateorder/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: "Cancelled",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel order.");
      }

      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? data : ord))
      );
      showToast("Order cancelled successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to cancel order.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order record?")) return;
    try {
      const res = await fetch(`/orders/deleteorder/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete order.");
      }

      setOrders((prev) => prev.filter((ord) => ord._id !== orderId));
      showToast("Order record deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to delete order.", "error");
    }
  };

  // Metrics for Admin Dashboard
  const totalRevenue = orders
    .filter((o) => o.orderStatus !== "Cancelled")
    .reduce((sum, ord) => sum + (parseFloat(ord.totalAmount) || 0), 0);

  const pendingCount = orders.filter((o) => o.orderStatus === "Processing").length;
  const shippedCount = orders.filter((o) => o.orderStatus === "Shipped").length;
  const deliveredCount = orders.filter((o) => o.orderStatus === "Delivered").length;
  const cancelledCount = orders.filter((o) => o.orderStatus === "Cancelled").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isAdmin ? "Admin Order Management Dashboard" : "My Orders History"}
        </h1>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {/* Admin Dashboard Metrics Widget Removed per User Request */}

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
            <span className="text-4xl">📦</span>
            <p className="text-gray-500 font-semibold mt-3">No orders found.</p>
          </div>
        ) : isAdmin ? (
          /* Simplified Admin Table showing Customer, Products, and Status */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Products Ordered</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Customer: Who ordered the product */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">
                          {ord.userId?.name || "Guest Customer"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {ord.userId?.email || ord.contactNumber || "No email"}
                        </div>
                      </td>

                      {/* Products: What product */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {ord.items && ord.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-800 flex items-center gap-2">
                              <span className="font-bold text-gray-900">{item.quantity}x</span>
                              <span className="truncate max-w-xs">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <select
                          disabled={updatingId === ord._id}
                          value={ord.orderStatus}
                          onChange={(e) => handleStatusChangeDirectly(ord._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase border focus:outline-none cursor-pointer transition-colors ${
                            ord.orderStatus === "Delivered"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ord.orderStatus === "Cancelled"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : ord.orderStatus === "Shipped"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={updatingId === ord._id}
                          onClick={() => handleDeleteOrder(ord._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                          title="Delete Order Record"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Simplified Customer Table showing Date, Products, Total, Status, and Action */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Placed</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Date Placed */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{formatDate(ord.createdAt)}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {ord._id}</div>
                      </td>

                      {/* Products */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {ord.items && ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-800">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-8 h-8 rounded object-cover border border-gray-100 shrink-0"
                                />
                              )}
                              <div>
                                <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-sm font-bold text-blue-600">
                        RS {parseFloat(ord.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase inline-block ${
                            ord.orderStatus === "Delivered"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : ord.orderStatus === "Cancelled"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : ord.orderStatus === "Shipped"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {ord.orderStatus === "Processing" ? (
                          <button
                            disabled={updatingId === ord._id}
                            onClick={() => handleCancelOrder(ord._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1 px-3 rounded-lg border border-red-200 transition text-xs cursor-pointer disabled:opacity-50"
                          >
                            Cancel Order
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default OrderPage;
