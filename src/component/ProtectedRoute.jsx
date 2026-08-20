import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const { token, isAuthenticated } = useSelector((state) => state.user);
  const location = useLocation();

  const hasToken = token || localStorage.getItem("token");

  return hasToken || isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
      replace
    />
  );
};

export default ProtectedRoute;
