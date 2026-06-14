const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { authLimiter } = require("../middleware/rateLimiter");
const { register, login, updateProfile } = require("../controllers/authController");

const router = express.Router();

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));

router.get(
  "/profile",
  protect,
  asyncHandler((req, res) => {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt,
      preferences: {
        tourDisabled: req.user.preferences?.tourDisabled ?? false,
        tourCompletedAt: req.user.preferences?.tourCompletedAt ?? null,
      },
    });
  }),
);

router.patch("/profile", protect, asyncHandler(updateProfile));

module.exports = router;
