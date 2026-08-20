import { useEffect, useState } from "react";
import axios from "axios";

const VendorEarnings = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const userInfo = JSON.parse(
          localStorage.getItem("userInfo")
        );

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(
          "http://localhost:5000/api/vendor-earnings/dashboard",
          config
        );

        setData(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchEarnings();
  }, []);

  if (!data) {
    return (
      <h2 className="text-center mt-10 text-2xl">
        Loading...
      </h2>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">
        Vendor Earnings Dashboard
      </h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white shadow-lg rounded-xl p-5">
          <h3 className="text-gray-600">
            Total Sales
          </h3>

          <p className="text-3xl font-bold">
            ₹{Number(data.totalSales || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h3 className="text-gray-600">
            Total Orders
          </h3>

          <p className="text-3xl font-bold">
            {data.totalOrders}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h3 className="text-gray-600">
            Total Earnings
          </h3>

          <p className="text-3xl font-bold text-green-600">
            ₹{Number(data.totalEarnings || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h3 className="text-gray-600">
            Pending Earnings
          </h3>

          <p className="text-3xl font-bold text-yellow-600">
            ₹{Number(data.pendingEarnings || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-5">
          <h3 className="text-gray-600">
            Available Balance
          </h3>

          <p className="text-3xl font-bold text-blue-600">
            ₹{Number(data.availableBalance || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* EARNINGS TABLE */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left">
                Order
              </th>

              <th className="p-3 text-left">
                Sales
              </th>

              <th className="p-3 text-left">
                Commission
              </th>

              <th className="p-3 text-left">
                Earnings
              </th>

              <th className="p-3 text-left">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {data.earnings.map((item) => (
              <tr
                key={item._id}
                className="border-b"
              >
                <td className="p-3">
                  {item.order}
                </td>

                <td className="p-3">
                  ₹{Number(item.orderAmount || 0).toFixed(2)}
                </td>

                <td className="p-3">
                  ₹{Number(item.commissionAmount || 0).toFixed(2)}
                </td>

                <td className="p-3 font-semibold">
                  ₹{Number(item.vendorAmount || 0).toFixed(2)}
                </td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white ${
                      item.status ===
                      "credited"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorEarnings;