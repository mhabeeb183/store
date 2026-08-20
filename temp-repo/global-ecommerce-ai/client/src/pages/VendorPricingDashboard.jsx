import { useEffect, useState } from "react";
import axios from "axios";

const VendorPricingDashboard = () => {
const [products, setProducts] = useState([]);

useEffect(() => {
const fetchPricingData = async () => {
try {
const userInfo = JSON.parse(
localStorage.getItem("userInfo")
);


    const { data } = await axios.get(
      "http://localhost:5000/api/dynamic-pricing/vendor",
      {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
    );

    setProducts(data);
  } catch (error) {
    console.error(error);
  }
};

fetchPricingData();


}, []);

const updatePricing = async (
product
) => {
try {
const userInfo = JSON.parse(
localStorage.getItem("userInfo")
);


  await axios.put(
    `http://localhost:5000/api/vendor-pricing/${product._id}`,
    {
      dynamicPricingEnabled:
        product.dynamicPricingEnabled,

      minPrice:
        product.minPrice,

      maxPrice:
        product.maxPrice,
    },
    {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }
  );

  alert(
    "Pricing settings updated"
  );
} catch (error) {
  console.error(error);

  alert(
    "Failed to update pricing"
  );
}


};

return ( <div className="p-6"> <h1 className="text-3xl font-bold mb-6">
Dynamic Pricing Dashboard </h1>


  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product) => (
      <div
        key={product._id}
        className="bg-white shadow-lg rounded-xl p-5"
      >
        <h2 className="text-xl font-bold mb-3">
          {product.name}
        </h2>

        <p>
          <strong>Base Price:</strong> ₹
          {product.basePrice}
        </p>

        <p>
          <strong>Dynamic Price:</strong> ₹
          {product.dynamicPrice}
        </p>

        <p>
          <strong>Increase:</strong> ₹
          {(product.dynamicPrice || 0) -
            (product.basePrice || 0)}
        </p>

        <p className="mt-2">
          <strong>Stock:</strong>{" "}
          {product.stock}
        </p>

        <p>
          <strong>Sold:</strong>{" "}
          {product.soldCount}
        </p>

        <p>
          <strong>Stock Status:</strong>{" "}
          {product.stockStatus}
        </p>

        <p>
          <strong>Demand:</strong>{" "}
          {product.demandStatus}
        </p>

        <div className="mt-3">
          <strong>
            Applied Rules:
          </strong>

          {product.pricingRulesApplied
            ?.length > 0 ? (
            <ul className="list-disc ml-5">
              {product.pricingRulesApplied.map(
                (rule, index) => (
                  <li key={index}>
                    {rule}
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>No Rules Applied</p>
          )}
        </div>

        <div className="mt-4 border-t pt-4">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={
                product.dynamicPricingEnabled || false
              }
              onChange={(e) => {
                setProducts(
                  products.map((p) =>
                    p._id === product._id
                      ? {
                          ...p,
                          dynamicPricingEnabled:
                            e.target.checked,
                        }
                      : p
                  )
                );
              }}
            />

            Enable Dynamic Pricing
          </label>

          <input
            type="number"
            placeholder="Min Price"
            value={product.minPrice || ""}
            onChange={(e) => {
              setProducts(
                products.map((p) =>
                  p._id === product._id
                    ? {
                        ...p,
                        minPrice: Number(
                          e.target.value
                        ),
                      }
                    : p
                )
              );
            }}
            className="border p-2 rounded w-full mb-2"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={product.maxPrice || ""}
            onChange={(e) => {
              setProducts(
                products.map((p) =>
                  p._id === product._id
                    ? {
                        ...p,
                        maxPrice: Number(
                          e.target.value
                        ),
                      }
                    : p
                )
              );
            }}
            className="border p-2 rounded w-full mb-3"
          />

          <button
            onClick={() =>
              updatePricing(product)
            }
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    ))}
  </div>
</div>


);
};

export default VendorPricingDashboard;
