import { useEffect, useState } from "react";
import axios from "axios";

const AdminPricingDashboard = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const { data } = await axios.get(
        "http://localhost:5000/api/products",
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const updatePricing = async (
    productId,
    adjustment
  ) => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      await axios.put(
        `http://localhost:5000/api/admin-pricing/${productId}`,
        {
          adjustment,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      alert(
        "Pricing Rule Updated Successfully"
      );

      fetchProducts();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Update Failed"
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">
        Admin Dynamic Pricing Panel
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            updatePricing={updatePricing}
          />
        ))}
      </div>
    </div>
  );
};

const ProductCard = ({
  product,
  updatePricing,
}) => {
  const [adjustment, setAdjustment] =
    useState(
      product.customPricingAdjustment || 0
    );

  return (
    <div className="bg-white shadow-lg rounded-xl p-5">
      <h2 className="text-2xl font-bold mb-3">
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
        <strong>Current Adjustment:</strong>{" "}
        {product.customPricingAdjustment || 0}
        %
      </p>

      <input
        type="number"
        value={adjustment}
        onChange={(e) =>
          setAdjustment(e.target.value)
        }
        placeholder="Enter Adjustment %"
        className="w-full border p-2 rounded mt-4"
      />

      <button
        onClick={() =>
          updatePricing(
            product._id,
            Number(adjustment)
          )
        }
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4 w-full"
      >
        Apply Rule
      </button>
    </div>
  );
};

export default AdminPricingDashboard;