const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const {
  listSessionsBySubject,
  createSession,
  getSession,
  updateSession,
  deleteSession,
} = require("../controllers/sessionController");
const outputRoutes = require("./outputRoutes");

const router = express.Router({ mergeParams: true });

router.get("/", asyncHandler(listSessionsBySubject));
router.post("/", asyncHandler(createSession));
router.get("/:sessionId", asyncHandler(getSession));
router.patch("/:sessionId", asyncHandler(updateSession));
router.delete("/:sessionId", asyncHandler(deleteSession));

router.use("/:sessionId/outputs", outputRoutes);

module.exports = router;
