const adminOrVendor = (req, res, next) => {
  if (
    req.user &&
    (
      req.user.role === "admin" ||
      req.user.role === "vendor"
    )
  ) {
    next();
  } else {
    res.status(401).json({
      message: "Admin or Vendor access only",
    });
  }
};

module.exports = adminOrVendor;