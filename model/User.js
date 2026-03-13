const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
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
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["student", "lab-technician"],
            required: true
        },
        studentId: {
            type: String,
            trim: true,
            default: null
        },
        profilePic: {
            type: String,
            default: "/assets/default_avatar.png"
        },
        bio: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);