const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: true,
            trim: true
        },
        studentId: {
            type: String,
            required: true,
            trim: true
        },
        labCode: {
            type: String,
            required: true,
            trim: true
        },
        buildingCode: {
            type: String,
            required: true,
            trim: true
        },
        buildingName: {
            type: String,
            required: true,
            trim: true
        },
        seat: {
            type: String,
            required: true,
            trim: true
        },
        date: {
            type: String,   
            required: true
        },
        timeSlot: {
            type: String, 
            required: true
        },
        status: {
            type: String,
            enum: ["Active", "Completed", "Cancelled", "No-show"],
            default: "Active"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);