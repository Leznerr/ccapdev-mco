const express = require("express");
const router = express.Router();

// Root route now directly renders the home page
router.get("/", (req, res) => {
    res.render("index", {
        title: "Home",
        pageCss: "home.css",
        pageScript: "home.js",
        includeJquery: true,
        includeData: true,
        includeGlobalScript: true
    });
});

router.get("/login", (req, res) => {
    res.render("login", {
        title: "Login",
        pageCss: "auth.css",
        pageScript: "auth.js",
        includeData: true
    });
});

router.get("/register", (req, res) => {
    res.render("register", {
        title: "Sign Up",
        pageCss: "auth.css",
        pageScript: "auth.js",
        includeData: true
    });
});

router.get("/profile", (req, res) => {
    res.render("profile", {
        title: "My Profile",
        pageCss: "profile.css",
        pageScript: "profile.js",
        includeJquery: true,
        includeData: true,
        includeGlobalScript: true
    });
});

router.get("/view-lab", (req, res) => {
    res.render("view-lab", {
        title: "Reserve a Lab",
        pageCss: "view-lab.css",
        pageScript: "view-lab.js",
        includeJquery: true,
        includeData: true,
        includeGlobalScript: true
    });
});

router.get("/admin-dashboard", (req, res) => {
    res.render("admin-dashboard", {
        title: "Admin Dashboard",
        pageCss: "admin.css",
        pageScript: "admin.js",
        includeJquery: true,
        includeData: true,
        includeGlobalScript: true
    });
});

module.exports = router;
