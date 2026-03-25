const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        role: {
            type: String,
            required: true,
            enum: ["Student", "Lab Technician"]
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        bio: {
            type: String,
            default: ""
        },
        profilePic: {
            type: String,
            default: ""
        },
        password: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
