const mongoose = require("mongoose");

const labSessionSchema = new mongoose.Schema(
{
  
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    description: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("LabSession", labSessionSchema);