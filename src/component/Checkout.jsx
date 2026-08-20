import React, { useState } from "react";
import Navbar from "./Navabar";
import Footer from "./Footer";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCart } from "../features/cart/cartSlice";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const buyNowItem = location.state?.buyNowItem;
  const cart = useSelector((state) => state.cart.items) || [];
  const token = localStorage.getItem("token");

  const checkoutItems = buyNowItem ? [{ ...buyNowItem, quantity: 1 }] : cart;

  // Shipping details state
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const parsePrice = (priceVal) => {
    if (typeof priceVal === "number") return priceVal;
    if (typeof priceVal === "string") {
      const cleaned = priceVal.replace("RS ", "").trim();
      return parseFloat(cleaned) || 0;
    }
    return 0;
  };

  const totalPrice = checkoutItems.reduce(
    (total, item) => total + parsePrice(item.price) * (item.quantity || 1),
    0
  );

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!address.trim() || !phone.trim()) {
      setErrorMsg("Please fill in shipping address and contact number.");
      return;
    }

    if (checkoutItems.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/orders/createorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: checkoutItems.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity || 1,
          })),
          totalAmount: totalPrice,
          shippingAddress: address,
          contactNumber: phone,
          isBuyNow: !!buyNowItem,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to place order.");
      }

      if (!buyNowItem) {
        dispatch(clearCart());
      }
      setOrderPlaced(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <Navbar />
        <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 text-center">
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h1>
            <p className="text-gray-500 text-sm">
              Thank you for your purchase. We have cleared your cart and started processing your order.
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigate("/orders")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition text-sm cursor-pointer"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition text-sm cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium mb-6">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Billing / Shipping Form */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Shipping Information</h2>
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Shipping Address</label>
                  <textarea
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your full home address"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || checkoutItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 cursor-pointer text-center text-sm"
                  >
                    {submitting ? "Placing Order..." : `Place Order (RS ${totalPrice.toFixed(2)})`}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-20">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-150">Order Summary</h2>
              
              {checkoutItems.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No items in your cart.</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto mb-4">
                  {checkoutItems.map((item, index) => (
                    <div key={index} className="py-2.5 flex justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-gray-400">Qty: {item.quantity || 1} × {item.price}</p>
                      </div>
                      <span className="font-semibold text-gray-900 shrink-0">
                        RS {(parsePrice(item.price) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-150 pt-4 flex justify-between items-baseline">
                <span className="font-bold text-gray-800">Grand Total:</span>
                <span className="text-xl font-extrabold text-blue-600">RS {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
