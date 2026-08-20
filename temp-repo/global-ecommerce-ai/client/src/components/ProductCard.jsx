import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Rating from "./Rating";
import { useTranslation } from "react-i18next";
import "@google/model-viewer";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const trackRecommendationClick =
    async () => {
      try {
        const userInfo = JSON.parse(
          localStorage.getItem("userInfo")
        );

        if (!userInfo?.token) return;

        await axios.post(
          "http://localhost:5000/api/recommendation-tracking",
          {
            user:
              userInfo._id ||
              userInfo.user?._id,
            product: product._id,
            category: product.category,
            brand: product.brand,
            action: "clicked",
          },
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );
      } catch (error) {
        console.log(
          "Recommendation Click Tracking Error:",
          error
        );
      }
    };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition duration-300">
      <Link
        to={`/product/${product._id}`}
        onClick={trackRecommendationClick}
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-60 object-cover"
          />
        ) : product.arModelUrl ? (
          <div className="w-full h-60 bg-gray-50 flex items-center justify-center overflow-hidden">
            <model-viewer
              src={product.arModelUrl}
              alt={product.name}
              auto-rotate
              rotation-per-second="30deg"
              environment-image="neutral"
              shadow-intensity="1"
              style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            ></model-viewer>
          </div>
        ) : (
          <img
            src="https://placehold.co/400x300/f1f5f9/94a3b8?text=No+Image"
            alt={product.name}
            className="w-full h-60 object-cover"
          />
        )}
      </Link>

      <div className="p-4">
        <h2 className="text-2xl font-bold">
          {product.name}
        </h2>

        <p className="text-gray-500">
          {product.brand}
        </p>

        <div className="mt-2">
          <Rating
            value={
              product.averageRating || 0
            }
            text={`${
              product.numReviews || 0
            } Reviews`}
          />
        </div>

        <div className="mt-3">
          {product.dynamicPrice >
          product.basePrice ? (
            <>
              <p className="text-gray-500 line-through text-lg">
                ₹{product.basePrice}
              </p>

              <h3 className="text-red-600 text-2xl font-bold">
                ₹{product.dynamicPrice}
              </h3>

              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                Dynamic Price Applied
              </span>
            </>
          ) : (
            <h3 className="text-blue-600 text-2xl font-bold">
              ₹
              {product.dynamicPrice ||
                product.basePrice ||
                product.price}
            </h3>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() =>
              dispatch(addToCart(product))
            }
            className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            {t("addToCart")}
          </button>
          <button
            onClick={() => {
              dispatch(addToCart(product));
              navigate("/checkout");
            }}
            className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 font-medium"
          >
            {t("buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;