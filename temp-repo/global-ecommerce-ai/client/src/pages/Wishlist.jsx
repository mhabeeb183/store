
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const userInfo = JSON.parse(
          localStorage.getItem("userInfo")
        );

        const { data } = await axios.get(
          "http://localhost:5000/api/wishlist",
          {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          }
        );

        setWishlist(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchWishlist();
  }, []);

  const removeWishlistHandler = async (
    productId
  ) => {
    try {
      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      await axios.delete(
        `http://localhost:5000/api/wishlist/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      setWishlist(
        wishlist.filter(
          (item) => item._id !== productId
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        My Wishlist ❤️
      </h1>

      {wishlist.length === 0 ? (
        <p>No wishlist items found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div
              key={product._id}
              className="relative"
            >
              <button
                onClick={() =>
                  removeWishlistHandler(
                    product._id
                  )
                }
                className="absolute top-2 right-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600"
              >
                ❌
              </button>

              <ProductCard
                product={product}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

