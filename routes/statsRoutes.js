const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { getPublicStats } = require("../controllers/statsController");

const router = express.Router();

router.get("/", asyncHandler(getPublicStats));

module.exports = router;
