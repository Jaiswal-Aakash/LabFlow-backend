const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const {
  listReportsBySubject,
  createReportForSubject,
  exportReportDraftForSubject,
} = require("../controllers/reportController");

const router = express.Router({ mergeParams: true });

router.get("/", asyncHandler(listReportsBySubject));
router.post("/", asyncHandler(createReportForSubject));
router.post("/export", asyncHandler(exportReportDraftForSubject));

module.exports = router;
