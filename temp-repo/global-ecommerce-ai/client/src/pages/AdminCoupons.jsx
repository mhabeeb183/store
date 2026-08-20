import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const AdminCoupons = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const token = userInfo?.token;

  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Form Fields State
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState(1000);
  const [expiryDate, setExpiryDate] = useState("");
  const [reason, setReason] = useState("Admin Reward");

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get("http://localhost:5000/api/coupons", config);
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const { data } = await axios.get("http://localhost:5000/api/users", config);
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (token) {
      fetchCoupons();
      fetchUsers();
    }
    // Set default expiry date to 30 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setExpiryDate(defaultExpiry.toISOString().split("T")[0]);
  }, [token]);

  // Handle auto-generation of coupon code
  const handleAutoGenerateCode = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(`SPECIAL-${randomStr}`);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !code || !discountValue || !expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setBtnLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const couponData = {
        userId,
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        expiryDate: new Date(expiryDate),
        reason,
      };

      await axios.post("http://localhost:5000/api/coupons", couponData, config);
      toast.success("Coupon created successfully!");
      
      // Reset form
      setUserId("");
      setCode("");
      setDiscountValue("");
      setMinOrderAmount(1000);
      setReason("Admin Reward");
      
      // Refetch coupons
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setBtnLoading(false);
    }
  };

  // Handle coupon deletion/revocation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to revoke/delete this coupon?")) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`http://localhost:5000/api/coupons/${id}`, config);
      toast.success("Coupon revoked successfully!");
      fetchCoupons();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to revoke coupon");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-gray-100 p-4 sm:p-8">
      {/* Decorative Blur Circles */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Coupon Management
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Create, configure, and manage promotional codes for user accounts.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-green-400 bg-green-950/30 px-2.5 py-1 rounded-full border border-green-800/40">
              Admin Portal Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Coupon Column */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
              
              <h2 className="text-xl font-bold mb-6 text-white flex items-center">
                <span className="mr-2">🎫</span> Create New Coupon
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Select User */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Target User *
                  </label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="bg-zinc-900 text-white">-- Choose User --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id} className="bg-zinc-900 text-white">
                        {u.name} ({u.email}) [{u.role}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Coupon Code *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME50"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                      🪄 Auto
                    </button>
                  </div>
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="percentage" className="bg-zinc-900 text-white">Percentage (%)</option>
                      <option value="fixed" className="bg-zinc-900 text-white">Fixed (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Value *
                    </label>
                    <input
                      type="number"
                      placeholder={discountType === "percentage" ? "10" : "150"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      required
                      min="1"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Min Order & Expiry */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Min Order (₹)
                    </label>
                    <input
                      type="number"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      min="0"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Reason / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Customer Reward"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {btnLoading ? "Creating..." : "Generate Coupon"}
                </button>
              </form>
            </div>
          </div>

          {/* Active Coupons Column */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center">
                <span className="mr-2">🏷️</span> Active System Coupons
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 text-sm">Loading active coupons...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-gray-500 mb-2 text-lg">No Coupons Generated</p>
                  <p className="text-gray-600 text-sm">Use the panel on the left to create the system's first coupon.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <th className="p-4">Code</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Min Spend</th>
                        <th className="p-4">Expires</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 bg-zinc-900/30">
                      {coupons.map((coupon) => {
                        const isExpired = new Date() > new Date(coupon.expiryDate);
                        
                        return (
                          <tr key={coupon._id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-4 font-mono font-bold text-blue-400 select-all">
                              {coupon.code}
                            </td>
                            <td className="p-4">
                              {coupon.user ? (
                                <div>
                                  <div className="font-semibold text-gray-200">{coupon.user.name}</div>
                                  <div className="text-xs text-gray-500">{coupon.user.email}</div>
                                </div>
                              ) : (
                                <span className="text-red-400 italic">User Deleted</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-gray-100">
                                {coupon.discountType === "percentage"
                                  ? `${coupon.discountValue}% Off`
                                  : `₹${coupon.discountValue}`}
                              </span>
                              <div className="text-xxs text-gray-500 mt-0.5">{coupon.reason}</div>
                            </td>
                            <td className="p-4 text-gray-300">
                              ₹{coupon.minOrderAmount}
                            </td>
                            <td className="p-4 text-sm text-gray-400">
                              {new Date(coupon.expiryDate).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-center">
                              {coupon.isUsed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/40 text-red-400 border border-red-900/40">
                                  Used
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-950/40 text-yellow-400 border border-yellow-900/40">
                                  Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-950/40 text-green-400 border border-green-900/40">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDelete(coupon._id)}
                                className="bg-red-950/20 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-900/30 hover:border-red-600/50 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 text-xs font-semibold"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCoupons;
