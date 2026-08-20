import { useEffect, useState } from "react";
import axios from "axios";

const orderStatuses = [
  "Packed",
  "Shipped",
  "Out For Delivery",
];

const VendorOrders = () => {
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState("all");  // all | cancelled | active

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token    = userInfo?.token;

  useEffect(() => {
    const fetchVendorOrders = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5000/api/orders/vendor-orders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(data);
      } catch (error) {
        console.error("Fetch Vendor Orders Error:", error.response?.data || error);
      }
    };
    fetchVendorOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, orderStatus: status } : order
        )
      );
    } catch (error) {
      alert(error.response?.data?.message || "Update failed");
    }
  };

  const statusColor = (status) => {
    if (status === "Delivered")        return "#16a34a";
    if (status === "Cancelled")        return "#dc2626";
    if (status === "Shipped")          return "#d97706";
    if (status === "Out For Delivery") return "#7c3aed";
    if (status === "Packed")           return "#2563eb";
    return "#6b7280";
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filter === "cancelled") return o.isCancelled;
    if (filter === "active")    return !o.isCancelled;
    return true;
  });

  const cancelledCount = orders.filter((o) => o.isCancelled).length;
  const activeCount    = orders.filter((o) => !o.isCancelled).length;

  return (
    <div style={{ padding: "32px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>
        📦 Vendor Orders
      </h1>

      {/* SUMMARY CARDS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px",
          padding: "14px 22px", minWidth: "130px", textAlign: "center"
        }}>
          <p style={{ fontSize: "26px", fontWeight: "800", color: "#1d4ed8" }}>{orders.length}</p>
          <p style={{ fontSize: "13px", color: "#3b82f6" }}>Total Orders</p>
        </div>
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px",
          padding: "14px 22px", minWidth: "130px", textAlign: "center"
        }}>
          <p style={{ fontSize: "26px", fontWeight: "800", color: "#15803d" }}>{activeCount}</p>
          <p style={{ fontSize: "13px", color: "#16a34a" }}>Active Orders</p>
        </div>
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px",
          padding: "14px 22px", minWidth: "130px", textAlign: "center"
        }}>
          <p style={{ fontSize: "26px", fontWeight: "800", color: "#c2410c" }}>{cancelledCount}</p>
          <p style={{ fontSize: "13px", color: "#ea580c" }}>Cancelled</p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {["all", "active", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 20px", borderRadius: "20px", border: "none",
              cursor: "pointer", fontWeight: "600", fontSize: "14px",
              background: filter === f ? "#4f46e5" : "#f3f4f6",
              color: filter === f ? "#fff" : "#374151",
              transition: "all 0.2s"
            }}
          >
            {f === "all" ? "All Orders" : f === "active" ? "Active" : "❌ Cancelled"}
          </button>
        ))}
      </div>

      {/* ORDER LIST */}
      {filteredOrders.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No orders found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOrders.map((order) => (
            <div key={order._id} style={{
              background: "#fff", borderRadius: "16px", padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: order.isCancelled ? "2px solid #fca5a5" : "1px solid #e5e7eb"
            }}>
              {/* ORDER HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                    Order ID: <span style={{ fontFamily: "monospace" }}>{order._id}</span>
                  </p>
                  <p style={{ fontSize: "18px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>
                    ₹{(order.totalPrice || 0) + (order.deliveryCharge || 0) - (order.discount || 0)}
                  </p>
                  <p style={{ fontSize: "13px", color: "#6b7280" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* STATUS BADGE */}
                <span style={{
                  background: order.isCancelled ? "#fee2e2" : "#f0fdf4",
                  color: statusColor(order.orderStatus),
                  padding: "6px 16px", borderRadius: "20px",
                  fontWeight: "700", fontSize: "13px", height: "fit-content"
                }}>
                  {order.orderStatus}
                </span>
              </div>

              {/* PAYMENT */}
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>
                Payment:{" "}
                <span style={{ color: order.isPaid ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                  {order.isPaid ? "✅ Paid" : "❌ Unpaid"}
                </span>
              </p>

              {/* PRODUCTS */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "10px", marginBottom: "12px" }}>
                <p style={{ fontWeight: "700", fontSize: "14px", marginBottom: "6px" }}>Products:</p>
                {order.orderItems.map((item, i) => (
                  <div key={i} style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
                    • {item.name} × {item.qty} — ₹{item.price}
                  </div>
                ))}
              </div>

              {/* SHIPPING DETAILS */}
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "10px", marginBottom: "12px" }}>
                <p style={{ fontWeight: "700", fontSize: "14px", marginBottom: "6px" }}>Shipping Details:</p>
                <div style={{ fontSize: "13px", color: "#4b5563", background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                  <p style={{ margin: "4px 0" }}>
                    👤 <strong>Name:</strong> {order.shippingDetails?.name || order.user?.name || "N/A"}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    📍 <strong>Address:</strong> {order.shippingDetails?.address || "N/A"}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    📞 <strong>Mobile:</strong> {order.shippingDetails?.mobile || "N/A"}
                  </p>
                  {order.user?.email && (
                    <p style={{ margin: "4px 0" }}>
                      ✉️ <strong>Email:</strong> {order.user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* ── CANCELLATION SECTION ──────────────────────────────── */}
              {order.isCancelled ? (
                <div style={{
                  background: "#fff7ed", borderRadius: "12px", padding: "16px",
                  border: "1px solid #fed7aa", marginTop: "4px"
                }}>
                  <p style={{ fontSize: "14px", fontWeight: "800", color: "#c2410c", marginBottom: "6px" }}>
                    ❌ Order Cancelled
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <p style={{ fontSize: "12px", color: "#9ca3af" }}>Cancelled On</p>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        {order.cancelledAt
                          ? new Date(order.cancelledAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", color: "#9ca3af" }}>Refund Amount</p>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#16a34a" }}>
                        {order.refundToWallet ? `₹${order.refundAmount} (Wallet)` : "No Refund"}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "12px", color: "#9ca3af" }}>Cancellation Reason</p>
                    <p style={{
                      fontSize: "14px", fontWeight: "600", color: "#7c3aed",
                      background: "#f5f3ff", padding: "8px 12px",
                      borderRadius: "8px", marginTop: "4px"
                    }}>
                      📝 "{order.cancellationReason || "No reason provided"}"
                    </p>
                  </div>
                </div>
              ) : (
                /* ── STATUS UPDATE DROPDOWN (active orders only) ── */
                <div style={{ marginTop: "8px" }}>
                  <label style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px", display: "block" }}>
                    Update Status:
                  </label>
                  <select
                    value={order.orderStatus}
                    disabled={["Delivered", "Cancelled"].includes(order.orderStatus)}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    style={{
                      border: "1px solid #d1d5db", padding: "8px 12px",
                      borderRadius: "8px", width: "100%", fontSize: "14px",
                      background: "#f9fafb", cursor: "pointer"
                    }}
                  >
                    <option value={order.orderStatus}>{order.orderStatus}</option>
                    {orderStatuses.map((status) =>
                      status !== order.orderStatus && (
                        <option key={status} value={status}>{status}</option>
                      )
                    )}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorOrders;