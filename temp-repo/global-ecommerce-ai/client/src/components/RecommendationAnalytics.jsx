import { useEffect, useState } from "react";
import axios from "axios";

const RecommendationAnalytics = () => {
  const [analytics, setAnalytics] =
    useState(null);

  useEffect(() => {
    const fetchAnalytics =
      async () => {
        try {
          const userInfo = JSON.parse(
            localStorage.getItem(
              "userInfo"
            )
          );

          const { data } =
            await axios.get(
              "http://localhost:5000/api/recommendation-analytics",
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

  if (!analytics) {
    return (
      <div className="p-6">
        Loading Analytics...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">
        📊 Recommendation Analytics
      </h1>

      {/* CARDS */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="text-gray-500">
            Recommendations
          </h3>

          <p className="text-3xl font-bold text-blue-600">
            {
              analytics.totalRecommendations
            }
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="text-gray-500">
            Clicks
          </h3>

          <p className="text-3xl font-bold text-green-600">
            {analytics.totalClicks}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="text-gray-500">
            Purchases
          </h3>

          <p className="text-3xl font-bold text-purple-600">
            {
              analytics.totalPurchases
            }
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="text-gray-500">
            Conversion Rate
          </h3>

          <p className="text-3xl font-bold text-red-600">
            {
              analytics.conversionRate
            }
            %
          </p>
        </div>
      </div>

      {/* TOP CATEGORIES */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Top Categories
        </h2>

        {analytics.topCategories?.map(
          (category) => (
            <div
              key={category._id}
              className="flex justify-between border-b py-2"
            >
              <span>
                {category._id}
              </span>

              <span>
                {category.count}
              </span>
            </div>
          )
        )}
      </div>

      {/* TOP BRANDS */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          Top Brands
        </h2>

        {analytics.topBrands?.map(
          (brand) => (
            <div
              key={brand._id}
              className="flex justify-between border-b py-2"
            >
              <span>
                {brand._id}
              </span>

              <span>
                {brand.count}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RecommendationAnalytics;