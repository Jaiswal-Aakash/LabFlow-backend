const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ["image", "pdf", "code"],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  relatedTo: {
    type: String,
    enum: ["labEntry", "document", "test"]
  }
}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);