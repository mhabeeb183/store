import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { userInfo } = useSelector(
    (state) => state.auth
  );

  const role =
    userInfo?.user?.role || userInfo?.role;

  return role === "admin" ? (
    children
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;