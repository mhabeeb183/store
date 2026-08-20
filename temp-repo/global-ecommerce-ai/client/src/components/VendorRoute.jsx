import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const VendorRoute = ({ children }) => {
  const { userInfo } = useSelector(
    (state) => state.auth
  );

  const role =
    userInfo?.user?.role || userInfo?.role;

  return role === "vendor" ? (
    children
  ) : (
    <Navigate to="/" />
  );
};

export default VendorRoute;