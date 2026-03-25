const mongoose = require("mongoose");

const { Schema } = mongoose;

const reservationSchema = new Schema(
    {
        reservationId: {
            type: Number,
            required: true,
            unique: true
        },
        reservationGroupId: {
            type: Number,
            required: true,
            index: true
        },
        lab: {
            type: Schema.Types.ObjectId,
            ref: "Lab",
            required: true,
            index: true
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
        reserver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        reservedFor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        reservedForName: {
            type: String,
            trim: true,
            default: null
        },
        profileUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        status: {
            type: String,
            required: true,
            enum: ["Active", "Cancelled", "Completed"],
            default: "Active"
        },
        isAnonymous: {
            type: Boolean,
            default: false
        },
        requestedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

reservationSchema.index({ lab: 1, seat: 1, date: 1, timeSlot: 1, status: 1 });
reservationSchema.index(
    { lab: 1, seat: 1, date: 1, timeSlot: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $eq: "Active" } }
    }
);

module.exports = mongoose.model("Reservation", reservationSchema);
