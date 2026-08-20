import { useEffect, useState } from "react";
import axios from "axios";

const VendorWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [deliveredProducts, setDeliveredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  const config = {
    headers: {
      Authorization: `Bearer ${userInfo.token}`,
    },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [withdrawalsRes, productsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/withdrawals/my", config),
        axios.get("http://localhost:5000/api/withdrawals/delivered-products", config),
      ]);
      setWithdrawals(withdrawalsRes.data);
      setDeliveredProducts(productsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const requestProductWithdrawal = async (earningId) => {
    try {
      await axios.post(
        "http://localhost:5000/api/withdrawals/request",
        { vendorEarningId: earningId },
        config
      );
      alert("Withdrawal request submitted for this product sale!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit request");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Withdrawal Management 💰
          </h1>
          <p className="text-gray-500 mt-2">
            Withdraw earnings from specific delivered sales and track your request history.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Request History */}
          <div className="lg:col-span-1 space-y-8">
            {/* History Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Request History
              </h2>
              {withdrawals.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No withdrawal history found.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
                  {withdrawals.map((item) => (
                    <div key={item._id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">₹{item.amount}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          item.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Delivered Products For Specific Withdrawal */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Delivered Product Sales
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Request immediate payout of your earnings for individual delivered orders.
              </p>

              {deliveredProducts.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-500 font-semibold">No delivered products found</p>
                  <p className="text-gray-400 text-xs mt-1">Earnings will appear here once orders are delivered.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveredProducts.map((item) => (
                    <div
                      key={item.earningId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/70 transition-all gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-14 h-14 rounded-lg object-cover bg-white border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                            🎁
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {item.productName}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            <span>Order ID: <span className="font-mono text-gray-700">{item.orderId?.substring(0, 8)}...</span></span>
                            <span>•</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 text-xs">
                            <span className="text-gray-400">Total Sale: ₹{item.orderAmount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Earning & Action */}
                      <div className="flex items-center sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 gap-3">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-400">Your Earning</p>
                          <p className="text-lg font-bold text-emerald-600">₹{Number(item.vendorAmount || 0).toFixed(2)}</p>
                        </div>

                        {item.withdrawalStatus === "Available" ? (
                          <button
                            onClick={() => requestProductWithdrawal(item.earningId)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                          >
                            Withdraw Sale Earning
                          </button>
                        ) : (
                          <span
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                              item.withdrawalStatus === "Approved"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : item.withdrawalStatus === "Rejected"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.withdrawalStatus === "Approved" && "✅ Paid"}
                            {item.withdrawalStatus === "Pending" && "⏳ Pending"}
                            {item.withdrawalStatus === "Rejected" && "❌ Rejected"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default VendorWithdrawals;