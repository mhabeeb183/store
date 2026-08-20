import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    recentOrders: [],
    monthlyRevenue: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const userInfo = JSON.parse(
          localStorage.getItem("userInfo")
        );

        const { data } = await axios.get(
          "http://localhost:5000/api/admin/analytics",
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );

        setAnalytics(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchAnalytics();
  }, []);

  const pieData = [
    {
      name: "Pending",
      value: analytics.pendingOrders,
    },
    {
      name: "Shipped",
      value: analytics.shippedOrders,
    },
    {
      name: "Delivered",
      value: analytics.deliveredOrders,
    },
  ];



  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-gray-800">
        Admin Dashboard
      </h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-gray-500">
            Total Users
          </h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {analytics.totalUsers}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-gray-500">
            Total Products
          </h2>
          <p className="text-4xl font-bold text-purple-600 mt-2">
            {analytics.totalProducts}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-gray-500">
            Total Orders
          </h2>
          <p className="text-4xl font-bold text-orange-500 mt-2">
            {analytics.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-gray-500">
            Total Revenue
          </h2>
          <p className="text-4xl font-bold text-green-600 mt-2">
            ₹{analytics.totalRevenue?.toLocaleString()}
          </p>
        </div>
        <Link
  to="/admin/recommendation-analytics"
  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition block"
>
  <h2 className="text-gray-500">
    Recommendation Analytics
  </h2>

  <p className="text-4xl font-bold text-indigo-600 mt-2">
    📊
  </p>

  <p className="text-sm text-gray-500 mt-2">
    View recommendation performance
  </p>
</Link>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow-lg p-8 mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Order Status Analytics
        </h2>

        <div className="w-full h-96">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={130}
                label
              >
                <Cell fill="#3B82F6" />
                <Cell fill="#F59E0B" />
                <Cell fill="#22C55E" />
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-blue-100 rounded-xl p-6">
          <h3 className="font-semibold text-blue-700">
            Pending Orders
          </h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.pendingOrders}
          </p>
        </div>

        <div className="bg-yellow-100 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-700">
            Shipped Orders
          </h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.shippedOrders}
          </p>
        </div>

        <div className="bg-green-100 rounded-xl p-6">
          <h3 className="font-semibold text-green-700">
            Delivered Orders
          </h3>
          <p className="text-3xl font-bold mt-2">
            {analytics.deliveredOrders}
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-8 mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Recent Orders
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">
                  Customer
                </th>
                <th className="p-3 text-left">
                  Amount
                </th>
                <th className="p-3 text-left">
                  Status
                </th>
                <th className="p-3 text-left">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {analytics.recentOrders?.map(
                (order) => (
                  <tr
                    key={order._id}
                    className="border-b"
                  >
                    <td className="p-3">
                      {order.user?.name}
                    </td>

                    <td className="p-3">
                      ₹{order.totalPrice}
                    </td>

                    <td className="p-3">
                      {order.orderStatus}
                    </td>

                    <td className="p-3">
                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-xl shadow-lg p-8 mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Monthly Revenue
        </h2>

        <div className="w-full h-96">
          <ResponsiveContainer>
            <LineChart
              data={
                analytics.monthlyRevenue || []
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={4}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


    </div>
  );
};

export default AdminDashboard;



