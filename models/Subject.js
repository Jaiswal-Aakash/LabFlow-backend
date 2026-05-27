const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
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

subjectSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);