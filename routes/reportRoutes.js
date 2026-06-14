const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const {
  listReportsBySession,
  createReport,
  exportReportDraft,
} = require("../controllers/reportController");

const router = express.Router({ mergeParams: true });

router.get("/", asyncHandler(listReportsBySession));
router.post("/", asyncHandler(createReport));
router.post("/export", asyncHandler(exportReportDraft));

module.exports = router;
