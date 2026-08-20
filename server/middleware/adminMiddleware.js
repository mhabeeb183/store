import jwt from "jsonwebtoken";

const AdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "failure",
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    
    req.user = decoded;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "failure",
        message: "Access denied. Admin role required.",
      });
    }

    next();
  } catch (err) {
    res.status(401).json({
      status: "failure",
      message: "Token is invalid or expired",
    });
  }
};

export const VendorOrAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "failure",
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    
    req.user = decoded;

    if (req.user.role !== "admin" && req.user.role !== "vendor") {
      return res.status(403).json({
        status: "failure",
        message: "Access denied. Admin or Vendor role required.",
      });
    }

    next();
  } catch (err) {
    res.status(401).json({
      status: "failure",
      message: "Token is invalid or expired",
    });
  }
};

export default AdminAuth;
