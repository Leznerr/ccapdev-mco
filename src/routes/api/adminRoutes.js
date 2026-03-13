const express = require("express");
const router = express.Router();
const {
    getReservations,
    updateReservation,
    deleteReservation,
    getLabAvailability
} = require("../../controllers/adminController");

router.get("/reservations",        getReservations);
router.put("/reservations/:id",    updateReservation);
router.delete("/reservations/:id", deleteReservation);

router.get("/labs/availability", getLabAvailability);

module.exports = router;