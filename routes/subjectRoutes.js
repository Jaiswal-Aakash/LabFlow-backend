const express = require("express");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const {
  listSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const sessionRoutes = require("./sessionRoutes");

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(listSubjects));
router.post("/", asyncHandler(createSubject));
router.get("/:subjectId", asyncHandler(getSubject));
router.patch("/:subjectId", asyncHandler(updateSubject));
router.delete("/:subjectId", asyncHandler(deleteSubject));

router.use("/:subjectId/sessions", sessionRoutes);

module.exports = router;
