const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const {
  getSharedReportMeta,
  downloadSharedReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/:shareToken", asyncHandler(getSharedReportMeta));
router.get("/:shareToken/download", asyncHandler(downloadSharedReport));

module.exports = router;
