const mongoose = require("mongoose");
const crypto = require("crypto");

const reportBlockSchema = new mongoose.Schema(
  {
    outputId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Output",
      required: true,
    },
    order: { type: Number, default: 0 },
    includeTitle: { type: Boolean, default: true },
    includeImage: { type: Boolean, default: true },
    includeNote: { type: Boolean, default: true },
    includeCode: { type: Boolean, default: true },
    includeTags: { type: Boolean, default: false },
    customTitle: { type: String, default: "", maxlength: 200 },
    customNote: { type: String, default: "", maxlength: 5000 },
    customCode: { type: String, default: "" },
    customCodeLanguage: { type: String, default: "javascript", maxlength: 50 },
    imageSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    imageAlign: {
      type: String,
      enum: ["left", "center"],
      default: "center",
    },
  },
  { _id: true },
);

const labReportSchema = new mongoose.Schema(
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
    /** @deprecated use sessions — kept for older saved reports */
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabSession",
      index: true,
    },
    sessions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "LabSession" }],
      default: [],
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    blocks: {
      type: [reportBlockSchema],
      default: [],
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    shareEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

labReportSchema.index({ user: 1, subject: 1 });
labReportSchema.index({ user: 1, session: 1 });

labReportSchema.statics.generateShareToken = () =>
  crypto.randomBytes(24).toString("hex");

module.exports = mongoose.model("LabReport", labReportSchema);
