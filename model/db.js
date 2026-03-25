const mongoose = require("mongoose");

async function connectDB() {
    const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/archerlabs_phase2";

    await mongoose.connect(mongoURI);
    console.log("MongoDB connected.");
}

async function disconnectDB() {
    await mongoose.disconnect();
}

module.exports = {
    connectDB,
    disconnectDB
};
