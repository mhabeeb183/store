import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCartAsync } from "../features/cart/cartSlice.js";
import Navbar from "./Navabar";

const WishlistPage = ({ wishlist = [], toggleWishlist }) => {
  const dispatch = useDispatch();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar wishlistCount={wishlist.length} />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-850 mb-6 flex items-center gap-2">
          <span>My Wishlist</span>
          <span className="text-sm bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
          </span>
        </h1>

        {wishlist.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="red"
              className="w-16 h-16 opacity-60"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Your wishlist is empty</p>
            <Link to="/">
              <button className="bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm">
                Explore Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((prod) => {
              return (
                <div
                  key={prod.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between items-center gap-4 transition duration-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="w-full flex justify-center bg-gray-50 rounded-lg overflow-hidden h-[200px]">
                    <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <h2 className="font-semibold text-gray-800 text-base sm:text-lg">
                      {prod.name}
                    </h2>
                    <p className="text-blue-600 font-bold">{prod.price}</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <button
                      onClick={() => dispatch(addToCartAsync(prod))}
                      className="w-full bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm shadow-sm"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(prod)}
                      className="w-full bg-white text-red-500 border border-red-200 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
