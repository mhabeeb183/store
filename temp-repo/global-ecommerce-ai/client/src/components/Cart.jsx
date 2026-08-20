import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import {
  increaseQuantity,
  decreaseQuantity,
} from "../redux/cartSlice";

const Cart = () => {
  const dispatch = useDispatch();

  const cartItems = useSelector(
    (state) => state.cart.cartItems
  );

  const totalPrice = cartItems.reduce(
    (acc, item) =>
      acc +
      (item.dynamicPrice ||
        item.price) *
        item.quantity,
    0
  );

  return (
    <div className="mt-6 md:mt-12 bg-white p-4 sm:p-6 rounded-2xl shadow-lg max-w-4xl mx-4 sm:mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Shopping Cart
      </h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-4 border-b pb-4"
              >
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {item.name}
                  </h3>

                  {(item.dynamicPrice ||
                    item.price) >
                  (item.basePrice ||
                    item.price) ? (
                    <>
                      <p className="text-gray-500 line-through">
                        ₹
                        {item.basePrice}
                      </p>

                      <p className="text-red-600 font-bold">
                        ₹
                        {
                          item.dynamicPrice
                        }
                      </p>

                      <span className="text-green-600 text-sm">
                        Dynamic Price
                      </span>
                    </>
                  ) : (
                    <p>
                      ₹
                      {item.dynamicPrice ||
                        item.price}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() =>
                        dispatch(
                          decreaseQuantity(
                            item._id
                          )
                        )
                      }
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      -
                    </button>

                    <span className="text-lg font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        dispatch(
                          increaseQuantity(
                            item._id
                          )
                        )
                      }
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-2xl font-bold mb-4">
              Total: ₹
              {totalPrice}
            </div>

            <Link
              to="/checkout"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Proceed To Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;