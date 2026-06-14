const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getReport,
  updateReport,
  deleteReport,
  exportReport,
  enableShare,
  disableShare,
} = require("../controllers/reportController");

const router = express.Router();

router.use(protect);

router.get("/:reportId", asyncHandler(getReport));
router.patch("/:reportId", asyncHandler(updateReport));
router.delete("/:reportId", asyncHandler(deleteReport));
router.get("/:reportId/export", asyncHandler(exportReport));
router.post("/:reportId/share", asyncHandler(enableShare));
router.delete("/:reportId/share", asyncHandler(disableShare));

module.exports = router;
