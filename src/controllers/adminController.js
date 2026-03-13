const Reservation = require("../../model/Reservation");
const Lab = require("../../model/Lab");
const Building = require("../../model/Building");

const getDashboard = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0]; 

        const totalToday = await Reservation.countDocuments({ date: today });
        const noShowsToday = await Reservation.countDocuments({ date: today, status: "No-show" });

        const labUsage = await Reservation.aggregate([
            { $match: { date: today } },
            { $group: { _id: "$labCode", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const mostUsedLab = labUsage.length > 0 ? labUsage[0]._id : "N/A";

        const labs = await Lab.find({});
        const activeNow = await Reservation.countDocuments({ date: today, status: "Active" });
        const totalCapacity = labs.reduce((sum, lab) => sum + lab.capacity, 0);
        const availableSeats = totalCapacity - activeNow;

        const reservations = await Reservation.find({ status: "Active" })
            .sort({ date: 1, timeSlot: 1 })
            .lean();

        const buildings = await Building.find({}).lean();
        const allLabs = await Lab.find({}).lean();

        res.render("admin-dashboard", {
            title: "Admin Dashboard – ArcherLabs",
            totalToday,
            noShowsToday,
            mostUsedLab,
            availableSeats,
            reservations,
            buildings,
            labs: allLabs
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", {
            title: "Server Error",
            statusCode: 500,
            message: "Failed to load the admin dashboard."
        });
    }
};


const getReservations = async (req, res) => {
    try {
        const filter = {};
        if (req.query.date) filter.date = req.query.date;
        if (req.query.status) filter.status = req.query.status;

        const reservations = await Reservation.find(filter)
            .sort({ date: 1, timeSlot: 1 })
            .lean();

        res.json(reservations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reservations." });
    }
};


const updateReservation = async (req, res) => {
    try {
        const { buildingCode, buildingName, labCode, seat, date, timeSlot } = req.body;

        const updated = await Reservation.findByIdAndUpdate(
            req.params.id,
            { buildingCode, buildingName, labCode, seat, date, timeSlot },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "Reservation not found." });
        }

        res.json({ message: "Reservation updated.", reservation: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update reservation." });
    }
};


const deleteReservation = async (req, res) => {
    try {
        const deleted = await Reservation.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ error: "Reservation not found." });
        }

        res.json({ message: "Reservation removed." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete reservation." });
    }
};


const getLabAvailability = async (req, res) => {
    try {
        const { labCode, date, timeSlot } = req.query;

        if (!labCode || !date || !timeSlot) {
            return res.status(400).json({ error: "labCode, date, and timeSlot are required." });
        }

        const lab = await Lab.findOne({ code: labCode }).lean();
        if (!lab) {
            return res.status(404).json({ error: "Lab not found." });
        }

        const occupied = await Reservation.countDocuments({
            labCode,
            date,
            timeSlot,
            status: "Active"
        });

        res.json({
            labCode,
            labName: lab.name,
            date,
            timeSlot,
            totalSeats: lab.capacity,
            occupiedSeats: occupied,
            remainingSeats: lab.capacity - occupied
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch lab availability." });
    }
};

module.exports = {
    getDashboard,
    getReservations,
    updateReservation,
    deleteReservation,
    getLabAvailability
};