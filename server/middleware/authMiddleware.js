import jwt from "jsonwebtoken";

const UserAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        status: "failure",
        message: "Authorization header missing",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "failure",
        message: "Token not found in authorization header",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      status: "failure",
      message: "Token is invalid or expired",
    });
  }
};

export default UserAuth;
