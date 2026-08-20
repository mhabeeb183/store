import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AdminAffiliates = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        setError("User authentication failed.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(
        "http://localhost:5000/api/affiliate/admin/analytics",
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setAnalytics(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch affiliate analytics:", err);
      setError(err.response?.data?.message || "Failed to load affiliate analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleApprovePayout = async (id) => {
    if (!window.confirm("Are you sure you want to approve this payout and credit the promoter's wallet?")) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      await axios.put(
        `http://localhost:5000/api/affiliate/admin/payout/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      alert("Payout approved successfully! Promoter's wallet has been credited.");
      fetchAnalytics(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve payout.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-600">Loading affiliate records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { affiliates, totalClicks, totalOrders, totalRevenue, totalCommission } = analytics || {
    affiliates: [],
    totalClicks: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
  };

  const pendingAffiliates = affiliates.filter((a) => a.payoutStatus === "Pending");
  const approvedAffiliates = affiliates.filter((a) => a.payoutStatus !== "Pending");

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Affiliate Management & Payouts</h1>
          <Link
            to="/admin"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500 text-sm font-medium uppercase">Total Affiliate Clicks</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{totalClicks}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500 text-sm font-medium uppercase">Referred Orders</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{totalOrders}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500 text-sm font-medium uppercase">Total Referral Revenue</h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">₹{totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500 text-sm font-medium uppercase">Total Commission Paid/Pending</h2>
            <p className="text-3xl font-bold text-orange-500 mt-2">₹{totalCommission.toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Payouts Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
            Pending Payout Requests ({pendingAffiliates.length})
          </h2>

          {pendingAffiliates.length === 0 ? (
            <p className="text-gray-500 py-4">No pending payout requests at this time.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3 text-sm font-semibold text-gray-600">Promoter (Affiliate)</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Buyer</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Product</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Sale Amount</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Commission</th>
                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAffiliates.map((aff) => (
                    <tr key={aff._id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{aff.affiliateUser?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{aff.affiliateUser?.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800">{aff.referredUser?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{aff.referredUser?.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800">{aff.product?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500 font-mono">Code: {aff.affiliateCode}</div>
                      </td>
                      <td className="p-3 font-semibold">₹{aff.orderAmount}</td>
                      <td className="p-3 text-orange-600 font-bold">₹{aff.commissionEarned}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleApprovePayout(aff._id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm transition"
                        >
                          Approve & Pay (Wallet)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History / Completed Payouts Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Approved / Paid Payout History ({approvedAffiliates.length})
          </h2>

          {approvedAffiliates.length === 0 ? (
            <p className="text-gray-500 py-4">No past payouts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3 text-sm font-semibold text-gray-600">Promoter (Affiliate)</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Buyer</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Product</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Sale Amount</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Commission Paid</th>
                    <th className="p-3 text-sm font-semibold text-gray-600 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedAffiliates.map((aff) => (
                    <tr key={aff._id} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{aff.affiliateUser?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{aff.affiliateUser?.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800">{aff.referredUser?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500">{aff.referredUser?.email}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800">{aff.product?.name || "N/A"}</div>
                        <div className="text-xs text-gray-500 font-mono">Code: {aff.affiliateCode}</div>
                      </td>
                      <td className="p-3 font-semibold">₹{aff.orderAmount}</td>
                      <td className="p-3 text-green-600 font-bold">₹{aff.commissionEarned}</td>
                      <td className="p-3 text-right">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                          {aff.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAffiliates;
