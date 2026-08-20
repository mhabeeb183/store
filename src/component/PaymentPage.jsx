import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";

const PaymentPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  const handlePayment = (e) => {
    e.preventDefault();
    showToast("Payment Successful! Thank you " + name, "success");
    navigate("/");
  };

  return (
    <div className="p-5 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Payment Page</h1>

      <form onSubmit={handlePayment} className="flex flex-col gap-3">
        <label>Name on Card</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <label>Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="border p-2 rounded"
          placeholder="enter your card number"
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-3"
        >
          pay
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;