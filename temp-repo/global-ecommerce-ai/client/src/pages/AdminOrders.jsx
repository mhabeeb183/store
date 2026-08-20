import { useEffect, useState } from "react";
import axios from "axios";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  const userInfo = JSON.parse(
    localStorage.getItem("userInfo")
  );

  const token = userInfo?.token;

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/orders/admin",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOrders(data);
    } catch (error) {
      console.error(error);
    }
  };

  // MARK ORDER AS PAID
  const markPaid = async (orderId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/pay`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchOrders();

      alert("Order marked as Paid");
    } catch (error) {
      console.error(
        "Admin Update Error:",
        error.response?.data || error
      );

      alert("Failed to mark paid");
    }
  };

  // UPDATE ORDER STATUS
  const updateStatus = async (
    orderId,
    status
  ) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchOrders();

      alert(
        `Order marked as ${status}`
      );
    } catch (error) {
      console.error(
        "Admin Update Error:",
        error.response?.data || error
      );

      alert(
        "Failed to update status"
      );
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        Admin Orders
      </h1>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <p>
                <strong>
                  Customer:
                </strong>{" "}
                {order.user?.name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {order.user?.email}
              </p>

              <p>
                <strong>Total:</strong> ₹
                {(order.totalPrice || 0) + (order.deliveryCharge || 0) - (order.discount || 0)}
              </p>

              <p>
                <strong>
                  Payment:
                </strong>{" "}
                <span
                  className={
                    order.isPaid
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }
                >
                  {order.isPaid
                    ? "Paid"
                    : "Unpaid"}
                </span>
              </p>

              <p>
                <strong>
                  Order Status:
                </strong>{" "}
                <span
                  className={
                    order.orderStatus ===
                    "Delivered"
                      ? "text-green-600 font-bold"
                      : order.orderStatus ===
                        "Shipped"
                      ? "text-yellow-600 font-bold"
                      : "text-blue-600 font-bold"
                  }
                >
                  {order.orderStatus ||
                    "Order Placed"}
                </span>
              </p>

              <div className="flex gap-3 mt-4 flex-wrap">
                {!order.isPaid && (
                  <button
                    onClick={() =>
                      markPaid(
                        order._id
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Mark Paid
                  </button>
                )}

                                    {/* ADMIN CAN DELIVER ONLY AFTER OUT FOR DELIVERY */}
                  {order.orderStatus ===
                    "Out For Delivery" && (
                    <button
                      onClick={() =>
                        updateStatus(
                          order._id,
                          "Delivered"
                        )
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Mark Delivered
                    </button>
                  )}

                {order.orderStatus ===
                  "Delivered" && (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded font-semibold">
                    Delivered Successfully
                  </span>
                )}
              </div>

              <div className="mt-4">
                <strong>
                  Order Date:
                </strong>{" "}
                {new Date(
                  order.createdAt
                ).toLocaleDateString()}
              </div>

              <div className="mt-4">
                <strong>
                  Products:
                </strong>

                <ul className="mt-2">
                  {order.orderItems?.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="border-b py-2"
                      >
                        {item.name} ×{" "}
                        {item.qty}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

