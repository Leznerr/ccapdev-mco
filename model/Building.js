const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            unique: true
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
    { timestamps: true }
);

module.exports = mongoose.model("Building", buildingSchema);
