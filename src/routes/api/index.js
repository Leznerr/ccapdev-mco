const express = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const buildingRoutes = require("./buildingRoutes");
const labRoutes = require("./labRoutes");
const reservationRoutes = require("./reservationRoutes");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        message: "ArcherLabs API",
        endpoints: [
            "/api/auth/login",
            "/api/users",
            "/api/buildings",
            "/api/labs",
            "/api/reservations"
        ]
    });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/buildings", buildingRoutes);
router.use("/labs", labRoutes);
router.use("/reservations", reservationRoutes);

module.exports = router;
