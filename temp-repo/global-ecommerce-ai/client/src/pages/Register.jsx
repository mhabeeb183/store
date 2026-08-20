import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [role, setRole] =
    useState("user");

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const affiliateCode =
  localStorage.getItem(
    "affiliateCode"
  );

await axios.post(
  "http://localhost:5000/api/auth/register",
  {
    name,
    email,
    password,
    role,
     affiliateCode:
      localStorage.getItem(
        "affiliateCode"
      ),
  }
);

      alert("Registration Successful");

localStorage.removeItem(
  "affiliateCode"
);

navigate("/login");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Registration Failed"
      );
    }
  };

  return (
    <div className="max-w-md mx-4 sm:mx-auto mt-16 p-6 sm:p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-center mb-6 border-b border-gray-100 pb-4 text-gray-800">
        Register
      </h2>

      <form onSubmit={submitHandler}>
        <input
          type="text"
          placeholder="Enter Name"
          className="w-full border p-3 mb-4 rounded"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />

        <input
          type="email"
          placeholder="Enter Email"
          className="w-full border p-3 mb-4 rounded"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          className="w-full border p-3 mb-4 rounded"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <select
          className="w-full border p-3 mb-4 rounded"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="user">
            Customer
          </option>

          <option value="vendor">
            Vendor
          </option>
        </select>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700"
        >
          Register
        </button>
      </form>

      <p className="text-center mt-5">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-blue-600 font-semibold hover:underline"
        >
          Login Here
        </Link>
      </p>
    </div>
  );
};

export default Register;