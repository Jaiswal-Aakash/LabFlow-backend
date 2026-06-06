const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { uploadImages } = require("../middleware/uploadMiddleware");
const {
  listOutputsBySession,
  createOutputs,
  getOutput,
  updateOutput,
  deleteOutput,
} = require("../controllers/outputController");

const router = express.Router({ mergeParams: true });

const handleUpload = (req, res, next) => {
  uploadImages(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.get("/", asyncHandler(listOutputsBySession));
router.post("/", handleUpload, asyncHandler(createOutputs));

module.exports = router;
