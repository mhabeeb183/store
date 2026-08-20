import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { updateQuantityAsync, removeFromCartAsync } from "../features/cart/cartSlice.js";
import Navbar from "./Navabar";

const CartPage = ({ wishlist = [] }) => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart.items) || [];

  
  let total = 0;
  let totalCount = 0;
  for (let i = 0; i < cart.length; i++) {
    let priceStr = cart[i].price.replace("RS ", "");
    let priceNumber = parseFloat(priceStr);
    let qty = cart[i].quantity || 1;
    total = total + priceNumber * qty;
    totalCount = totalCount + qty;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar cartCount={totalCount} wishlistCount={wishlist.length} />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-850 mb-6 flex items-center gap-2">
          <span>My Cart</span>
          <span className="text-sm bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </span>
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center gap-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="w-16 h-16 text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Your cart is empty</p>
            <Link to="/">
              <button className="bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-colors shadow-sm text-sm">
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {cart.map((item, index) => {
                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-800 text-base sm:text-lg">
                          {item.name}
                        </h2>
                        <p className="text-blue-600 font-semibold text-sm sm:text-base">
                          {item.price}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-500 text-xs sm:text-sm">Quantity:</span>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <button
                              onClick={() => dispatch(updateQuantityAsync({ id: item.id, change: -1 }))}
                              className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-200 transition-colors font-bold text-sm"
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="px-2.5 text-gray-800 font-semibold text-sm select-none">
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => dispatch(updateQuantityAsync({ id: item.id, change: 1 }))}
                              className="px-2.5 py-0.5 text-gray-600 hover:bg-gray-200 transition-colors font-bold text-sm"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => dispatch(removeFromCartAsync(item.id))}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-150 transition duration-200 text-sm font-medium self-end sm:self-center"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg text-gray-550 font-medium">Grand Total</h2>
                <p className="text-2xl font-bold text-gray-900">RS {total.toFixed(2)}</p>
              </div>

              <Link to="/checkout" className="w-full sm:w-auto">
                <button className="bg-green-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-600 transition-colors shadow-md w-full sm:w-auto text-center cursor-pointer">
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;