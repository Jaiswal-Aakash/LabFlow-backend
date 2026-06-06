const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { authLimiter } = require("../middleware/rateLimiter");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.post("/register", authLimiter, asyncHandler(register));
router.post("/login", authLimiter, asyncHandler(login));

router.get(
  "/profile",
  protect,
  asyncHandler((req, res) => {
    res.json(req.user);
  }),
);

module.exports = router;
