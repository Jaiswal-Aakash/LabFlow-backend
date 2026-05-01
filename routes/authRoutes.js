const express = require("express");

const protect = require("../middleware/authMiddleware");
const { register, login } = require("../controllers/authcontroller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);


router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;