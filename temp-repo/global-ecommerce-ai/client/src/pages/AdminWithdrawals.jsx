import { useEffect, useState } from "react";
import axios from "axios";

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] =
    useState([]);

  const userInfo = JSON.parse(
    localStorage.getItem("userInfo")
  );

  const config = {
    headers: {
      Authorization: `Bearer ${userInfo.token}`,
    },
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/withdrawals/all",
        config
      );

      setWithdrawals(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const approveHandler = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/withdrawals/approve/${id}`,
        {},
        config
      );

      fetchWithdrawals();
    } catch (error) {
      alert(
        error.response?.data?.message
      );
    }
  };

  const rejectHandler = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/withdrawals/reject/${id}`,
        {},
        config
      );

      fetchWithdrawals();
    } catch (error) {
      alert(
        error.response?.data?.message
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Admin Withdrawals
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">
              Vendor
            </th>

            <th className="p-2">
              Email
            </th>

            <th className="p-2">
              Amount
            </th>

            <th className="p-2">
              Status
            </th>

            <th className="p-2">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {withdrawals.map((item) => (
            <tr key={item._id}>
              <td className="p-2">
                {item.vendor?.name}
              </td>

              <td className="p-2">
                {item.vendor?.email}
              </td>

              <td className="p-2">
                ₹{item.amount}
              </td>

              <td className="p-2">
                {item.status}
              </td>

              <td className="p-2">
                {item.status ===
                  "Pending" && (
                  <>
                    <button
                      onClick={() =>
                        approveHandler(
                          item._id
                        )
                      }
                      className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        rejectHandler(
                          item._id
                        )
                      }
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminWithdrawals;