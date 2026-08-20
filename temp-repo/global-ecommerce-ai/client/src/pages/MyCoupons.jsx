import { useEffect, useState } from "react";
import axios from "axios";

const MyCoupons = () => {
  const [coupons, setCoupons] =
    useState([]);

  useEffect(() => {
    const fetchCoupons =
      async () => {
        try {
          const userInfo =
            JSON.parse(
              localStorage.getItem(
                "userInfo"
              )
            );

          const { data } =
            await axios.get(
              "http://localhost:5000/api/coupons/my",
              {
                headers: {
                  Authorization: `Bearer ${userInfo.token}`,
                },
              }
            );

          setCoupons(data);
        } catch (error) {
          console.log(error);
        }
      };

    fetchCoupons();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        My Coupons
      </h1>

      {coupons.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow">
          No Coupons Available
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {coupons.map(
            (coupon) => (
              <div
                key={coupon._id}
                className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-green-500"
              >
                <h2 className="text-2xl font-bold text-green-600">
                  {coupon.code}
                </h2>

                <p className="mt-2">
                  ₹
                  {
                    coupon.discountValue
                  }{" "}
                  OFF
                </p>

                <p>
                  Minimum Order ₹
                  {
                    coupon.minOrderAmount
                  }
                </p>

                <p className="text-gray-500 mt-2">
                  Expires:
                  {" "}
                  {new Date(
                    coupon.expiryDate
                  ).toLocaleDateString()}
                </p>

                <p className="mt-2">
                  Status:
                  {" "}
                  {coupon.isUsed
                    ? "Used"
                    : "Active"}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default MyCoupons;