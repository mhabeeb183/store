import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../socket/socket";

const trackingSteps = [
  { status: "Order Placed", label: "Order Placed", desc: "Your order has been logged on the blockchain ledger." },
  { status: "Packed", label: "Packed & Verified", desc: "Sellers have packed items and allocated warehouse slots." },
  { status: "Shipped", label: "Shipped in Transit", desc: "Shipped out from primary inventory node." },
  { status: "Out For Delivery", label: "Out for Delivery", desc: "Local logistics hub delivery driver is en route." },
  { status: "Delivered", label: "Delivered Successfully", desc: "Package handed over and signed." },
];

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  useEffect(() => {
    fetchOrder();

    socket.emit("joinOrder", id);

    socket.on("orderStatusUpdated", (data) => {
      if (data.orderId === id) {
        setOrder((prev) => ({
          ...prev,
          orderStatus: data.status,
          statusHistory: data.statusHistory,
        }));
      }
    });

    return () => {
      socket.emit("leaveOrder", id);
      socket.off("orderStatusUpdated");
    };
  }, [id]);

  const fetchOrder = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      const { data } = await axios.get(`http://localhost:5000/api/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrder(data);
      setLoading(false);
    } catch (error) {
      console.error("Fetch Order Error:", error.response?.data || error);
      setLoading(false);
    }
  };

  const cancelOrderHandler = async () => {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }

    setSubmittingCancel(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      await axios.put(
        `http://localhost:5000/api/orders/${id}/cancel`,
        { reason: cancelReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Order cancelled successfully");
      setShowCancelModal(false);
      fetchOrder(); // Reload order details
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading tracking dashboard...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm">
          <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-sm text-gray-500 mt-2">We couldn't retrieve tracking information for this order ID.</p>
          <button
            onClick={() => navigate("/myorders")}
            className="mt-6 inline-flex items-center justify-center px-6 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = order.orderStatus === "Cancelled";
  const canCancel = !isCancelled && ["Order Placed", "Packed"].includes(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tracking Console</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-0.5">Order #{order._id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on: {new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking Connected
            </div>

            <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              isCancelled
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
            }`}>
              {order.orderStatus}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Status Timeline */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
              Delivery Timeline
            </h3>

            {isCancelled ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="font-bold text-red-900">This order has been cancelled</h4>
                {order.cancellationReason && (
                  <p className="text-sm text-red-600 mt-1.5">Reason: "{order.cancellationReason}"</p>
                )}
                {order.cancelledAt && (
                  <p className="text-xs text-red-400 mt-1">
                    On: {new Date(order.cancelledAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                {trackingSteps.map((step, idx) => {
                  const historyItem = order.statusHistory?.find((h) => h.status === step.status);
                  const isCompleted = !!historyItem;
                  const isActive = order.orderStatus === step.status;

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline Bullet */}
                      <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition duration-200 ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-white border-gray-200 text-gray-300"
                      }`}>
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className={`text-sm font-bold transition duration-200 ${
                            isActive ? "text-indigo-600 text-base" : isCompleted ? "text-gray-900" : "text-gray-400"
                          }`}>
                            {step.label}
                          </h4>
                          {historyItem && (
                            <span className="text-xs text-gray-500 font-medium">
                              {new Date(historyItem.updatedAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isCompleted || isActive ? "text-gray-600" : "text-gray-400"}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Delivery Address
              </h3>
              {order.shippingDetails?.name ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Recipient</span>
                    <p className="font-semibold text-gray-900 mt-0.5">{order.shippingDetails.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Mobile Number</span>
                    <p className="font-semibold text-gray-900 mt-0.5">{order.shippingDetails.mobile}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Address</span>
                    <p className="font-medium text-gray-600 mt-0.5 leading-relaxed">{order.shippingDetails.address}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No delivery address saved for this order.</p>
              )}
            </div>

            {/* Billing Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Billing Summary
              </h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{order.totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-gray-900">
                    {order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 pt-3">
                  <span>Total Amount</span>
                  <span>₹{Math.max((order.totalPrice || 0) + (order.deliveryCharge || 0) - (order.discount || 0), 0)}</span>
                </div>
                <div className="flex justify-between text-gray-500 pt-1">
                  <span>Payment Method</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod || "Razorpay"}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Payment Status</span>
                  <span className={`font-semibold ${order.isPaid ? "text-emerald-600" : "text-amber-600"}`}>
                    {order.isPaid ? "Paid" : "Cash on Delivery (Pending)"}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Amount Paid</span>
                  <span>₹{order.paidPrice || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
              <button
                onClick={() => navigate("/myorders")}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold transition cursor-pointer"
              >
                Go to My Orders
              </button>

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
              <p className="text-sm text-gray-500 mt-1">Please let us know why you are cancelling this order.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Reason for Cancellation</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, found a better price elsewhere, wrong shipping address"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                disabled={submittingCancel}
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <button
                disabled={submittingCancel}
                onClick={cancelOrderHandler}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                {submittingCancel ? "Processing..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;