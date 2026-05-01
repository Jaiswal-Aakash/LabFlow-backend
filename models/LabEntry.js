const mongoose = require("mongoose");

const labEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  code: String,
  notes: String,
  outputs: [String]
}, { timestamps: true });

module.exports = mongoose.model("LabEntry", labEntrySchema);