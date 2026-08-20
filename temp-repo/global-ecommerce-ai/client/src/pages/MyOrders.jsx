import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const CANCEL_REASONS = [
  "Changed my mind",
  "Found a better price elsewhere",
  "Ordered by mistake",
  "Delivery is taking too long",
  "Product details were incorrect",
  "Other",
];

const MyOrders = () => {
  const [orders, setOrders]               = useState([]);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);  // order being cancelled
  const [selectedReason, setSelectedReason]     = useState("");
  const [customReason, setCustomReason]         = useState("");
  const [cancelling, setCancelling]             = useState(false);
  const [successMsg, setSuccessMsg]             = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token    = userInfo?.token;

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/orders/myorders",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(data);
    } catch (error) {
      console.error("Fetch Orders Error:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  // ── CANCEL HANDLER ────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;

    if (!reason) {
      alert("Please select or enter a cancellation reason.");
      return;
    }

    try {
      setCancelling(true);
      const { data } = await axios.put(
        `http://localhost:5000/api/orders/${cancelModalOrder._id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(
        data.refundAmount > 0
          ? `Order cancelled! ₹${data.refundAmount} refunded to your wallet.`
          : "Order cancelled successfully."
      );

      setCancelModalOrder(null);
      setSelectedReason("");
      setCustomReason("");
      fetchMyOrders();

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (status) =>
    !["Delivered", "Cancelled", "Out For Delivery"].includes(status);

  const statusColor = (status) => {
    if (status === "Delivered")       return { color: "#16a34a", fontWeight: "700" };
    if (status === "Cancelled")       return { color: "#dc2626", fontWeight: "700" };
    if (status === "Shipped")         return { color: "#d97706", fontWeight: "700" };
    if (status === "Out For Delivery") return { color: "#7c3aed", fontWeight: "700" };
    return { color: "#2563eb", fontWeight: "700" };
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "24px" }}>
        🧾 My Orders
      </h1>

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div style={{
          background: "#dcfce7", border: "1px solid #16a34a", borderRadius: "10px",
          padding: "14px 20px", marginBottom: "20px", color: "#15803d",
          fontWeight: "600", fontSize: "15px"
        }}>
          ✅ {successMsg}
        </div>
      )}

      {orders.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No orders found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {orders.map((order) => (
            <div key={order._id} style={{
              background: "#fff", borderRadius: "16px", padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: order.isCancelled ? "2px solid #fca5a5" : "1px solid #e5e7eb"
            }}>
              {/* ORDER ID */}
              <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>
                Order ID: <span style={{ fontFamily: "monospace" }}>{order._id}</span>
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  {/* TOTAL */}
                  <p style={{ fontSize: "18px", fontWeight: "700", color: "#111827" }}>
                    ₹{(order.totalPrice || 0) + (order.deliveryCharge || 0) - (order.discount || 0)}
                  </p>

                  {/* PAYMENT */}
                  <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                    Payment:{" "}
                    <span style={{ color: order.isPaid ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                      {order.isPaid ? "✅ Paid" : "❌ Unpaid"}
                    </span>
                  </p>

                  {/* DATE */}
                  <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
                    Placed on: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* STATUS BADGE */}
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    ...statusColor(order.orderStatus),
                    background: order.isCancelled ? "#fee2e2" : "#f0fdf4",
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px"
                  }}>
                    {order.orderStatus || "Pending"}
                  </span>
                </div>
              </div>

              {/* PRODUCTS */}
              <div style={{ marginTop: "12px", borderTop: "1px solid #f3f4f6", paddingTop: "10px" }}>
                {order.orderItems.map((item, i) => (
                  <div key={i} style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
                    • {item.name} × {item.qty} — ₹{item.price}
                  </div>
                ))}
              </div>

              {/* CANCELLATION INFO */}
              {order.isCancelled && (
                <div style={{
                  marginTop: "12px", background: "#fff7ed", borderRadius: "10px",
                  padding: "12px 16px", border: "1px solid #fed7aa"
                }}>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#c2410c" }}>
                    ❌ Cancelled on: {new Date(order.cancelledAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: "13px", color: "#7c3aed", marginTop: "4px" }}>
                    📝 Reason: <strong>{order.cancellationReason}</strong>
                  </p>
                  {order.refundToWallet && (
                    <p style={{ fontSize: "13px", color: "#16a34a", marginTop: "4px" }}>
                      💰 Refund of ₹{order.refundAmount} added to your wallet
                    </p>
                  )}
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  to={`/track-order/${order._id}`}
                  style={{
                    background: "#4f46e5", color: "#fff", padding: "8px 18px",
                    borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "600"
                  }}
                >
                  📍 Track Order
                </Link>

                {canCancel(order.orderStatus) && (
                  <button
                    onClick={() => {
                      setCancelModalOrder(order);
                      setSelectedReason("");
                      setCustomReason("");
                    }}
                    style={{
                      background: "#dc2626", color: "#fff", border: "none",
                      padding: "8px 18px", borderRadius: "8px", cursor: "pointer",
                      fontSize: "14px", fontWeight: "600"
                    }}
                  >
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CANCEL MODAL ─────────────────────────────────────────── */}
      {cancelModalOrder && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.55)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px", padding: "32px",
            maxWidth: "480px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "6px", color: "#111827" }}>
              ❌ Cancel Order
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
              Order ID: <span style={{ fontFamily: "monospace" }}>{cancelModalOrder._id}</span>
            </p>

            <p style={{ fontWeight: "600", fontSize: "14px", marginBottom: "10px", color: "#374151" }}>
              Please select a reason for cancellation:
            </p>

            {/* REASON OPTIONS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                  border: selectedReason === reason ? "2px solid #4f46e5" : "1px solid #e5e7eb",
                  background: selectedReason === reason ? "#eef2ff" : "#fafafa",
                  transition: "all 0.2s"
                }}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    style={{ accentColor: "#4f46e5" }}
                  />
                  <span style={{ fontSize: "14px", color: "#374151" }}>{reason}</span>
                </label>
              ))}
            </div>

            {/* CUSTOM REASON INPUT */}
            {selectedReason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please describe your reason..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "10px",
                  border: "1px solid #d1d5db", fontSize: "14px", resize: "vertical",
                  marginBottom: "16px", outline: "none", boxSizing: "border-box"
                }}
              />
            )}

            {/* REFUND NOTE */}
            {cancelModalOrder.isPaid && (
              <div style={{
                background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px",
                padding: "10px 14px", marginBottom: "16px"
              }}>
                <p style={{ fontSize: "13px", color: "#15803d", fontWeight: "600" }}>
                  💰 ₹{cancelModalOrder.paidPrice || cancelModalOrder.totalPrice} will be refunded to your wallet
                </p>
              </div>
            )}

            {/* BUTTONS */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setCancelModalOrder(null)}
                style={{
                  padding: "10px 22px", borderRadius: "10px", border: "1px solid #d1d5db",
                  background: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "14px"
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                style={{
                  padding: "10px 22px", borderRadius: "10px", border: "none",
                  background: cancelling ? "#9ca3af" : "#dc2626",
                  color: "#fff", cursor: cancelling ? "not-allowed" : "pointer",
                  fontWeight: "700", fontSize: "14px"
                }}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;