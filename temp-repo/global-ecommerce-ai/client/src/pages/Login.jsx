import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const dispatch = useDispatch();
const navigate = useNavigate();

const submitHandler = async (e) => {
e.preventDefault();


try {
  const { data } = await axios.post(
    "http://localhost:5000/api/auth/login",
    {
      email,
      password,
    }
  );

  dispatch(loginSuccess(data));

  localStorage.setItem(
    "userInfo",
    JSON.stringify(data)
  );

  navigate("/");
} catch (error) {
  alert(
    error.response?.data?.message ||
      "Invalid Credentials"
  );
}


};

  return (
    <div className="max-w-md mx-4 sm:mx-auto mt-16 p-6 sm:p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-center mb-6 border-b border-gray-100 pb-4 text-gray-800">
        Login
      </h2>

      <form onSubmit={submitHandler}>
        <input
          type="email"
          placeholder="Enter Email"
          className="w-full border border-gray-200 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Enter Password"
          className="w-full border border-gray-200 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          Login
        </button>
      </form>

      <p className="text-center mt-5 text-gray-600">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-blue-600 font-semibold hover:underline"
        >
          Register Here
        </Link>
      </p>
    </div>
  );
};

export default Login;
