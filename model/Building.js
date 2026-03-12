const mongoose = require("mongoose");

const bldgSchema = new mongoose.Schema(
    {
        buildingCode:{
            type: String,
            required: true,
            trim: true
        },
        name:{
            type: String,
            required: true,
            trim: true
        }
    }
);

module.exports = mongoose.model("Building", bldgSchema);