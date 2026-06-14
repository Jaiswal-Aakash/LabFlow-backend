const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getOutput,
  updateOutput,
  deleteOutput,
  downloadOutputImage,
} = require("../controllers/outputController");

const router = express.Router();

router.use(protect);

router.get("/:outputId/download-image", asyncHandler(downloadOutputImage));
router.get("/:outputId", asyncHandler(getOutput));
router.patch("/:outputId", asyncHandler(updateOutput));
router.delete("/:outputId", asyncHandler(deleteOutput));

module.exports = router;
