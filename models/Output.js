const mongoose = require("mongoose");

const outputSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSession",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      default: "",
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageFilename: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [5000, "Note cannot exceed 5000 characters"],
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
    codeLanguage: {
      type: String,
      trim: true,
      default: "javascript",
      maxlength: [50],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

outputSchema.index({ user: 1, tags: 1 });
outputSchema.index({ user: 1, subject: 1, session: 1, sortOrder: 1 });
outputSchema.index(
  { title: "text", note: "text", code: "text", tags: "text" },
  { weights: { tags: 10, title: 5, note: 3, code: 2 } },
);

module.exports = mongoose.model("Output", outputSchema);
