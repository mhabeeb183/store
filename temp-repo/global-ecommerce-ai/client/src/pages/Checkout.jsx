import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { clearCart } from "../redux/cartSlice";
import { loadRazorpay } from "../utils/razorpay";

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [walletBalance, setWalletBalance] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // 'razorpay' or 'cod'

  // Shipping Form State
  const [shippingDetails, setShippingDetails] = useState({
    name: "",
    mobile: "",
    address: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartItems = useSelector((state) => state.cart.cartItems);

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.dynamicPrice || item.price) * item.quantity,
    0
  );
  const deliveryCharge = isSubscribed ? 0 : 70;
  const finalPrice = Math.max(totalPrice - discount, 0) + deliveryCharge;

  // Calculate remaining payment after wallet deduction
  const walletDeduction = useWallet ? Math.min(walletBalance, finalPrice) : 0;
  const remainingAmount = finalPrice - walletDeduction;

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const token = userInfo?.token;

        const { data } = await axios.get("http://localhost:5000/api/wallet", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setWalletBalance(data.walletBalance);
        const subActive = !!(data.isSubscribed && data.subscriptionExpiry && new Date(data.subscriptionExpiry) > new Date());
        setIsSubscribed(subActive);
      } catch (error) {
        console.error("Wallet fetch error:", error);
      }
    };

    fetchWallet();

    // Prefill user details if available
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo?.user) {
      setShippingDetails((prev) => ({
        ...prev,
        name: userInfo.user.name || "",
      }));
    }
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!shippingDetails.name.trim()) errors.name = "Recipient name is required";
    if (!shippingDetails.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(shippingDetails.mobile.trim())) {
      errors.mobile = "Please enter a valid 10-digit mobile number";
    }
    if (!shippingDetails.address.trim()) errors.address = "Shipping address is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createOrder = async (token, paidAmount, isPaidVal = true) => {
    const orderItems = cartItems.map((item) => ({
      name: item.name,
      qty: item.quantity,
      image: item.images[0],
      price: item.dynamicPrice || item.price,
      product: item._id,
    }));

    await axios.post(
      "http://localhost:5000/api/orders",
      {
        orderItems,
        totalPrice,
        isPaid: isPaidVal,
        paidPrice: paidAmount,
        couponCode,
        discount,
        shippingDetails,
        paymentMethod: remainingAmount === 0 ? "Wallet" : paymentMethod === "cod" ? "COD" : "Razorpay",
        affiliateCode: localStorage.getItem("affiliateCode"),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    dispatch(clearCart());
  };

  const applyCouponHandler = async () => {
    if (!couponCode.trim()) {
      alert("Please enter a coupon code");
      return;
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      const { data } = await axios.post(
        "http://localhost:5000/api/coupons/validate",
        {
          code: couponCode,
          orderAmount: totalPrice,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setDiscount(data.discount);
      alert(`Coupon Applied. Discount ₹${data.discount}`);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid Coupon");
    }
  };

  const placeOrderHandler = async () => {
    if (!validateForm()) {
      alert("Please complete the shipping information correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      let walletUsed = 0;

      // Use Wallet First
      if (useWallet && walletBalance > 0) {
        walletUsed = Math.min(walletBalance, finalPrice);

        await axios.post(
          "http://localhost:5000/api/wallet/use-wallet",
          {
            amount: walletUsed,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // 1. Wallet Covers Entire Amount
      if (remainingAmount <= 0) {
        await createOrder(token, finalPrice, true);
        alert("Order placed successfully using Wallet!");
        navigate("/myorders");
        return;
      }

      // 2. Cash on Delivery (COD) for the remaining balance
      if (paymentMethod === "cod") {
        // For COD, the remaining balance is unpaid initially (only wallet portion is paid)
        await createOrder(token, walletUsed, false);
        alert("Order placed successfully via Cash on Delivery!");
        navigate("/myorders");
        return;
      }

      // 3. Razorpay For Remaining Amount
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      const { data } = await axios.post(
        "http://localhost:5000/api/payment/create-order",
        {
          amount: remainingAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Global E-Commerce",
        description: "Order Payment",
        order_id: data.id,
        handler: async function () {
          try {
            // PaidAmount = Wallet portion + Razorpay portion
            await createOrder(token, finalPrice, true);
            alert("Payment Successful!");
            navigate("/myorders");
          } catch (error) {
            console.error("Order completion error:", error);
            alert("Order Save Failed");
          }
        },
        prefill: {
          name: shippingDetails.name || userInfo?.name || "",
          email: userInfo?.email || "",
          contact: shippingDetails.mobile || "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.message || "Payment Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Checkout
        </h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-lg mx-auto">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">Add products to your cart before checking out.</p>
            <button
              onClick={() => navigate("/products")}
              className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Shop Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Form Fields */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Form Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">1</span>
                  <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recipient Name</label>
                    <input
                      type="text"
                      value={shippingDetails.name}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                      placeholder="e.g. Mohamed Habeeb"
                      className={`w-full px-4 py-3 rounded-xl border outline-none text-gray-800 transition focus:ring-2 focus:ring-indigo-500/20 ${
                        formErrors.name ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-600"
                      }`}
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                    <input
                      type="text"
                      value={shippingDetails.mobile}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, mobile: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className={`w-full px-4 py-3 rounded-xl border outline-none text-gray-800 transition focus:ring-2 focus:ring-indigo-500/20 ${
                        formErrors.mobile ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-600"
                      }`}
                    />
                    {formErrors.mobile && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shipping Address</label>
                    <textarea
                      rows={3}
                      value={shippingDetails.address}
                      onChange={(e) => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                      placeholder="Street address, Apartment, City, State, ZIP code"
                      className={`w-full px-4 py-3 rounded-xl border outline-none text-gray-800 transition resize-none focus:ring-2 focus:ring-indigo-500/20 ${
                        formErrors.address ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-600"
                      }`}
                    />
                    {formErrors.address && <p className="text-red-500 text-xs mt-1.5 font-medium">{formErrors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">2</span>
                  <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
                </div>

                {remainingAmount === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">Fully Covered by Wallet</h4>
                      <p className="text-sm text-emerald-600">The total amount will be deducted from your Wallet Balance.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Razorpay Option */}
                    <div
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`relative cursor-pointer rounded-2xl border p-5 flex flex-col justify-between h-36 transition duration-200 select-none group hover:border-indigo-500 hover:shadow-md ${
                        paymentMethod === "razorpay"
                          ? "border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/10"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === "razorpay" ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                        }`}>
                          {paymentMethod === "razorpay" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Pay with Razorpay</h4>
                        <p className="text-xs text-gray-500 mt-1">Cards, UPI, Netbanking, Wallet</p>
                      </div>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div
                      onClick={() => setPaymentMethod("cod")}
                      className={`relative cursor-pointer rounded-2xl border p-5 flex flex-col justify-between h-36 transition duration-200 select-none group hover:border-indigo-500 hover:shadow-md ${
                        paymentMethod === "cod"
                          ? "border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/10"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === "cod" ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                        }`}>
                          {paymentMethod === "cod" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Cash on Delivery</h4>
                        <p className="text-xs text-gray-500 mt-1">Pay with cash when package arrives</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary Panel */}
            <div className="lg:col-span-5 space-y-6">
              {/* Order Items Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                  Order Summary
                </h3>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex gap-4 items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          <img src={item.images[0]} alt={item.name} className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{(item.dynamicPrice || item.price) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code section */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Have a coupon code?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE20"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={applyCouponHandler}
                      className="px-5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Wallet Deduction Card */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Use Wallet Balance</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Available: ₹{walletBalance}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWallet}
                        disabled={walletBalance <= 0}
                        onChange={() => setUseWallet(!useWallet)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                {/* Subtotal, discount, dynamic values */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-gray-900">
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  {useWallet && walletDeduction > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                      <span>Wallet Deduction</span>
                      <span>-₹{walletDeduction}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                    <span>Total Amount</span>
                    <span>₹{remainingAmount}</span>
                  </div>
                </div>

                {/* Checkout CTA button */}
                <button
                  onClick={placeOrderHandler}
                  disabled={isSubmitting}
                  className={`mt-6 w-full flex items-center justify-center py-4 rounded-2xl text-white text-base font-bold transition duration-200 select-none ${
                    isSubmitting
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/10 cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </div>
                  ) : remainingAmount === 0 ? (
                    "Place Order with Wallet"
                  ) : paymentMethod === "cod" ? (
                    walletDeduction > 0
                      ? `Place COD Order (₹${remainingAmount} COD / ₹${walletDeduction} Wallet)`
                      : "Place Order (Cash on Delivery)"
                  ) : walletDeduction > 0 ? (
                    `Pay ₹${remainingAmount} with Razorpay (₹${walletDeduction} from Wallet)`
                  ) : (
                    `Pay ₹${remainingAmount} with Razorpay`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;