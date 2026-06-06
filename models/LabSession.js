const mongoose = require("mongoose");

const labSessionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    sessionDate: {
      type: Date,
      required: [true, "Session date is required"],
      index: true,
    },
  },
  { timestamps: true },
);

labSessionSchema.index({ user: 1, subject: 1, sessionDate: -1 });
labSessionSchema.index({ user: 1, subject: 1, createdAt: -1 });

module.exports = mongoose.model("LabSession", labSessionSchema);
