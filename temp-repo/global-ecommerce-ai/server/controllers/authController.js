const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Affiliate = require(
  "../models/affiliateModel"
);

const Coupon = require(
  "../models/couponModel"
);

// GENERATE JWT TOKEN
const generateToken = (id, role, isAdmin) => {
  return jwt.sign(
    {
      id,
      role,
      isAdmin,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "7d",
    }
  );
};

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const {
  name,
  email,
  password,
  role,
  affiliateCode,
} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // CHECK EXISTING USER
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: (role === "vendor" || role === "user") ? role : "user",
    });

    //
// REFERRAL REGISTRATION
//
if (affiliateCode) {
  try {
    const affiliate =
      await Affiliate.findOne({
        affiliateCode,
      });

    if (affiliate) {
      affiliate.referredUser =
        user._id;

      await affiliate.save();

      // Welcome Coupon For New User
      const welcomeCoupon =
        "WELCOME200" +
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

      await Coupon.create({
        code: welcomeCoupon,
        user: user._id,
        discountType: "fixed",
        discountValue: 200,
        minOrderAmount: 1000,
        expiryDate: new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000
        ),
        reason:
          "Referral Signup Reward",
      });

      console.log(
        "Welcome Coupon Created:",
        welcomeCoupon
      );
    }
  } catch (error) {
    console.log(
      "Referral Registration Error:",
      error.message
    );
  }
}

    // RESPONSE
    res.status(201).json({
      message: "User registered successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },

      token: generateToken(
        user._id,
        user.role,
        user.isAdmin
      ),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // FIND USER
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
      });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // RESPONSE
    res.status(200).json({
      message: "Login successful",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },

      token: generateToken(
        user._id,
        user.role,
        user.isAdmin
      ),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};