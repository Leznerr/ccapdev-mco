const Lab = require("../../model/Lab");
const Reservation = require("../../model/Reservation");

async function listLabs(req, res) {
    const query = {};
    if (req.query.buildingCode) {
        query.buildingCode = String(req.query.buildingCode).toUpperCase();
    }

    const labs = await Lab.find(query).sort({ code: 1 });
    return res.status(200).json(labs);
}

async function getLabByCode(req, res) {
    const { code } = req.params;
    const lab = await Lab.findOne({ code: code.toUpperCase() });

    if (!lab) {
        return res.status(404).json({ error: "Lab not found." });
    }

    return res.status(200).json(lab);
}

async function getLabAvailability(req, res) {
    const { code } = req.params;
    const { date, timeSlot } = req.query;

    const labCode = code.toUpperCase();
    const lab = await Lab.findOne({ code: labCode });
    if (!lab) {
        return res.status(404).json({ error: "Lab not found." });
    }

    if (!date || !timeSlot) {
        return res.status(400).json({
            error: "Query params date and timeSlot are required."
        });
    }

    const occupiedSeats = await Reservation.countDocuments({
        labCode,
        date,
        timeSlot,
        status: "Active"
    });

    const totalSeats = Number(lab.capacity);
    const availableSeats = Math.max(totalSeats - occupiedSeats, 0);

    return res.status(200).json({
        labCode,
        date,
        timeSlot,
        totalSeats,
        occupiedSeats,
        availableSeats
    });
}

module.exports = {
    listLabs,
    getLabByCode,
    getLabAvailability
};
