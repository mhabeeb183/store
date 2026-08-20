import { useEffect, useState } from "react";
import axios from "axios";

const AffiliateDashboard = () => {
  const [data, setData] =
    useState(null);

  useEffect(() => {
    const fetchDashboard =
      async () => {
        try {
          const userInfo =
            JSON.parse(
              localStorage.getItem(
                "userInfo"
              )
            );

          const response =
            await axios.get(
              "http://localhost:5000/api/affiliate/dashboard",
              {
                headers: {
                  Authorization: `Bearer ${userInfo.token}`,
                },
              }
            );

          setData(
            response.data
          );
        } catch (error) {
          console.log(error);
        }
      };

    fetchDashboard();
  }, []);

  if (!data) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Affiliate Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold">
            Total Clicks
          </h2>

          <p className="text-3xl text-blue-600 font-bold">
            {data.totalClicks}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold">
            Total Orders
          </h2>

          <p className="text-3xl text-green-600 font-bold">
            {data.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-bold">
            Total Commission
          </h2>

          <p className="text-3xl text-purple-600 font-bold">
            ₹
            {
              data.totalCommission
            }
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Affiliate Links
        </h2>

        {data.affiliates.map(
          (item) => (
            <div
              key={item._id}
              className="border-b py-4"
            >
              <p>
                Product:
                {" "}
                {item.product?.name}
              </p>

              <p>
                Code:
                {" "}
                {item.affiliateCode}
              </p>

              <p>
                Clicks:
                {" "}
                {item.clicks}
              </p>

              <p>
                Commission:
                ₹
                {
                  item.commissionEarned
                }
              </p>

              <p>
                Status:
                {" "}
                {item.payoutStatus}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AffiliateDashboard;