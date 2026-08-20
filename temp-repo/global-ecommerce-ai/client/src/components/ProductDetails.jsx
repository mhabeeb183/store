import axios from "axios";
import {
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import { fetchProducts } from "../api/productApi";
import { addToCart } from "../redux/cartSlice";

import ProductCard from "./ProductCard";
import Rating from "./Rating";
import ARProductViewer from "./ARProductViewer";

const ProductDetails = () => {
 
  const { id } = useParams();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] =
    useState([]);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [affiliateLink, setAffiliateLink] =
  useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {

  const params =
    new URLSearchParams(
      location.search
    );

  const ref =
    params.get("ref");

  if (ref) {
    localStorage.setItem(
      "affiliateCode",
      ref
    );

    console.log(
      "Affiliate Saved:",
      ref
    );
  }

  const loadProduct = async () => {
      try {
        const products = await fetchProducts();

        const foundProduct = products.find(
          (item) => item._id === id
        );

        setProduct(foundProduct);

        const userInfo = localStorage.getItem("userInfo")
          ? JSON.parse(localStorage.getItem("userInfo"))
          : null;

        if (userInfo && userInfo.token) {
          const { data } = await axios.get(
            `http://localhost:5000/api/recommendations/${id}`,
            {
              headers: {
                Authorization: `Bearer ${userInfo.token}`,
              },
            }
          );
          setRecommendations(data || []);
          console.log("Recommendations:", data);
        }
      } catch (error) {
        console.log(error);
      }
    };
   

    loadProduct();
 }, [id, location.search]);

  const addWishlistHandler = async () => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      await axios.post(
        `http://localhost:5000/api/wishlist/${product._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      alert("Added to Wishlist ❤️");
    } catch (error) {
      console.log(error);
      alert("Login first");
    }
  };
const submitReviewHandler = async (e) => {
  e.preventDefault();

  try {
    const userInfo = JSON.parse(
      localStorage.getItem("userInfo")
    );

    console.log("USER:", userInfo);

    const response = await axios.post(
      `http://localhost:5000/api/products/${product._id}/reviews`,
      {
        rating: Number(rating),
        comment,
      },
      {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
    );
 

    console.log(
      "SUCCESS:",
      response.data
    );

    alert("Review Added Successfully");
  } catch (error) {
    console.log(
      "FULL ERROR:",
      error
    );

    console.log(
      "SERVER RESPONSE:",
      error.response?.data
    );

    alert(
      error.response?.data?.message ||
        error.message
    );
  }
};
 const generateAffiliateLinkHandler =
  async () => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const { data } = await axios.post(
        "http://localhost:5000/api/affiliate/generate",
        {
          productId: product._id,
        },
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setAffiliateLink(
        data.affiliateLink
      );

      alert(
        "Affiliate Link Generated Successfully"
      );
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to generate affiliate link"
      );
    }
  };
  const copyAffiliateLink = () => {
  navigator.clipboard.writeText(
    affiliateLink
  );

  alert("Affiliate Link Copied");
};
const shareAffiliateOnWhatsApp =
  () => {
    if (!affiliateLink) {
      alert(
        "Generate affiliate link first"
      );
      return;
    }

    const message =
      `🔥 Check out this product!\n\n${affiliateLink}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };

  if (!product) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Product Details */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <ARProductViewer product={product} />

        <div>
          <h1 className="text-4xl font-bold">
            {product.name}
          </h1>

          <p className="text-gray-500 mt-2">
            {product.brand}
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Category: {product.category}
          </p>

          <div className="mt-4">
            <Rating
              value={
                product.averageRating || 0
              }
              text={`${
                product.numReviews || 0
              } Reviews`}
            />
          </div>

          <div className="mt-6">
   {(product.dynamicPrice || 0) >
  (product.basePrice ||
    product.price) ? (
    <>
      <p className="text-gray-500 line-through text-xl">
        ₹ {product.basePrice}
      </p>

      <h2 className="text-4xl text-red-600 font-bold">
        ₹ {product.dynamicPrice}
      </h2>

      <span className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold">
        Dynamic Price Applied
      </span>
    </>
  ) : (
    <h2 className="text-3xl text-blue-600 font-bold">
      ₹{" "}
      {product.dynamicPrice ||
        product.basePrice ||
        product.price}
    </h2>
  )}
</div>

          <p className="mt-6 text-lg">
            {product.description}
          </p>

          <div className="flex gap-4 mt-8 flex-wrap">
            <button
              onClick={() =>
                dispatch(addToCart(product))
              }
              className="bg-gray-200 text-black px-8 py-3 rounded-xl hover:bg-gray-300 font-semibold transition"
            >
              {t("addToCart")}
            </button>

            <button
              onClick={() => {
                dispatch(addToCart(product));
                navigate("/checkout");
              }}
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 font-semibold transition"
            >
              {t("buyNow")}
            </button>

            <button
              onClick={addWishlistHandler}
              className="bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 font-semibold transition"
            >
              ❤️ {t("wishlist")}
            </button>
          </div>
          <div className="mt-8 border-t pt-6">
  <h2 className="text-2xl font-bold mb-4">
    {t("affiliateMarketing")}
  </h2>

  <button
    onClick={
      generateAffiliateLinkHandler
    }
    className="bg-green-600 text-white px-6 py-3 rounded"
  >
    {t("generateLink")}
  </button>

  {affiliateLink && (
    <div className="mt-4">
      <label htmlFor="affiliate-link" className="sr-only">
        Affiliate Link
      </label>
      <input
        id="affiliate-link"
        name="affiliate-link"
        type="text"
        value={affiliateLink}
        readOnly
        className="w-full border p-3 rounded"
      />

      <div className="flex gap-3 mt-3">
        <button
          onClick={
            copyAffiliateLink
          }
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Copy Link
        </button>

        <button
          onClick={
            shareAffiliateOnWhatsApp
          }
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Share WhatsApp
        </button>
      </div>
    </div>
  )}
</div>
          {/* Affiliate Marketing */}


        </div>
      </div>

      {/* Write Review */}
      <div className="mt-12 bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold mb-4">
          Write a Review
        </h2>

        <form onSubmit={submitReviewHandler}>
          <div className="mb-4">
            <label htmlFor="review-rating" className="block mb-2">
              Rating
            </label>

            <select
              id="review-rating"
              name="rating"
              value={rating}
              onChange={(e) =>
                setRating(e.target.value)
              }
              className="w-full border p-3 rounded"
            >
              <option value="1">
                1 Star
              </option>
              <option value="2">
                2 Stars
              </option>
              <option value="3">
                3 Stars
              </option>
              <option value="4">
                4 Stars
              </option>
              <option value="5">
                5 Stars
              </option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="review-comment" className="block mb-2">
              Comment
            </label>

            <textarea
              id="review-comment"
              name="comment"
              rows="4"
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              className="w-full border p-3 rounded"
              placeholder="Write your review..."
              required
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* Customer Reviews */}
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6">
          Customer Reviews
        </h2>

        {product.reviews &&
        product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white p-4 rounded-xl shadow"
              >
                <h3 className="font-bold text-lg">
                  {review.name}
                </h3>

                <Rating
                  value={review.rating}
                />

                <p className="text-gray-600 mt-2">
                  {review.comment}
                </p>

                <p className="text-sm text-gray-400 mt-2">
                  {new Date(
                    review.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow">
            No reviews yet.
          </div>
        )}
      </div>

      {/* Recommended Products */}
      {recommendations.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">
            You May Also Like
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;