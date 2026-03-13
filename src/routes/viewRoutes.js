const express = require("express");
const router = express.Router();

// ==========================================
// BEA
// ==========================================
router.get("/", (req, res) => {
    res.render("index", { title: "Home - ArcherLabs", pageCss: "home.css" });
});

// ==========================================
// GAB
// ==========================================
router.get("/login", (req, res) => {
    res.render("login", { title: "Login - ArcherLabs" });
});

router.get("/register", (req, res) => {
    res.render("register", { title: "Register - ArcherLabs" });
});

// ==========================================
// RENZEL
// ==========================================
router.get("/view-lab", (req, res) => {
    res.render("view-lab", { title: "Seat Map - ArcherLabs" });
});

router.get("/profile", (req, res) => {
    res.render("profile", { title: "My Profile - ArcherLabs" });
});

// ==========================================
// ABIGAIL
// ==========================================
router.get("/admin-dashboard", (req, res) => {
    res.render("admin-dashboard", { title: "Technician Dashboard - ArcherLabs" });
});

module.exports = router;

