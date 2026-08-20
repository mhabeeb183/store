import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchCart } from "../features/cart/cartSlice.js";
import { loginSuccess } from "../features/user/userSlice.js";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    fetch("/api/users/google-client-id")
      .then((res) => res.json())
      .then((data) => {
        if (data.clientId) {
          setGoogleClientId(data.clientId);
        }
      })
      .catch((err) => console.error("Error fetching Google Client ID:", err));
  }, []);

  /* global google */
  useEffect(() => {
    if (googleClientId && window.google) {
      try {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLoginSuccess,
        });

        google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          {
            theme: "outline",
            size: "large",
            width: "360", // fits layout width nicely
            shape: "pill",
            text: "signin_with",
          }
        );
      } catch (err) {
        console.error("Google SSO rendering failed:", err);
      }
    }
  }, [googleClientId, isLogin]);

  const handleGoogleLoginSuccess = async (response) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Google Authentication failed.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      dispatch(loginSuccess({ user: data.user, token: data.token }));
      dispatch(fetchCart());

      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get("returnTo") || "/";
      navigate(returnTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/users/login" : "/api/users/register";
    const body = isLogin ? { email, password } : { name, email, password, role };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      dispatch(loginSuccess({ user: data.user, token: data.token }));
      dispatch(fetchCart());

      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get("returnTo") || "/";
      navigate(returnTo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100/80 px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98108_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
      <div className="absolute -left-20 -top-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200/50 shadow-xl shadow-zinc-200/40 w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link 
            to="/" 
            className="flex items-center gap-2 group inline-block focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/10 group-hover:scale-105 transition-transform">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent uppercase tracking-tight">
              FRESHCART
            </span>
          </Link>
          <h2 className="text-lg font-extrabold text-zinc-800 tracking-tight mt-5">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-zinc-400 text-xs font-semibold mt-1">
            {isLogin ? "Please enter your details to sign in." : "Sign up to begin your shopping experience."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-100 text-xs py-3 px-4 rounded-xl mb-6 flex items-center gap-2 font-semibold shadow-inner">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Register As</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("user")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer select-none active:scale-[0.98] ${
                      role === "user"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-600"
                    }`}
                  >
                    👤 Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("vendor")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-extrabold transition-all cursor-pointer select-none active:scale-[0.98] ${
                      role === "vendor"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                        : "bg-zinc-50/50 border-zinc-200 text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-600"
                    }`}
                  >
                    🏪 Vendor / Seller
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-zinc-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl transition-all text-xs uppercase tracking-wider mt-3 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {googleClientId && (
          <>
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-zinc-200"></div>
              <span className="flex-shrink mx-4 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-zinc-200"></div>
            </div>

            <div className="w-full flex justify-center min-h-[44px]">
              <div id="google-signin-btn"></div>
            </div>
          </>
        )}

        <div className="mt-8 text-center text-xs font-semibold text-zinc-400 border-t border-zinc-100 pt-6">
          {isLogin ? "New to FreshCart? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors ml-1 cursor-pointer"
          >
            {isLogin ? "Sign Up Free" : "Sign In Here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
