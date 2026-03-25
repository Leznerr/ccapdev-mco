const mongoose = require("mongoose");

const labSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        buildingCode: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        capacity: {
            type: Number,
            required: true,
            min: 1
        },
        location: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

labSchema.index({ buildingCode: 1 });

module.exports = mongoose.model("Lab", labSchema);
