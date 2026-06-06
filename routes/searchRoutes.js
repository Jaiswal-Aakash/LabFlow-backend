const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  searchOutputs,
  listTags,
} = require("../controllers/searchController");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(searchOutputs));
router.get("/tags", asyncHandler(listTags));

module.exports = router;
