import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminRoute = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.user);
  const location = useLocation();

  const hasToken = token || localStorage.getItem("token");
  const isAdmin = user?.role === "admin";

  if (!hasToken && !isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
