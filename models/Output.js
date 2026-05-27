const mongoose = require("mongoose");

const outputSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    labSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabSession",
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    notes: {
        type: String,
        default: ""
    },

    code: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Output", outputSchema);