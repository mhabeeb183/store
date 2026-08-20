import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const VendorRequestForm = () => {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !description.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      await axios.post(
        "http://localhost:5000/api/vendor-requests",
        { businessName, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Vendor application submitted successfully! Admin will review it shortly.");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">🏪 Become a Vendor</h2>
      <p className="text-gray-500 mb-6">
        Submit your business registration to start selling products on our ecosystem.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Acme Retailers"
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Business Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what products you plan to sell..."
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[120px]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-bold transition-all duration-200 ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer"
          }`}
        >
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default VendorRequestForm;
