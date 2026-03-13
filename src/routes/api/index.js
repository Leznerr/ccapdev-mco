const express = require("express");
const router = express.Router();

// ==========================================
// API Hub: All teammate routes will go here
// ==========================================
// Example: router.use('/auth', require('./authRoutes'));


router.use("/admin", require("./adminRoutes"));

module.exports = router;

