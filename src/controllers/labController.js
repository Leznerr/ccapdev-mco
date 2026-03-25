const Lab = require("../../model/Lab");
const Reservation = require("../../model/Reservation");

function parseTimeToMinutes(value) {
    const cleaned = String(value || "").trim().toUpperCase();
    if (!cleaned) return null;
    const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if (minute < 0 || minute > 59) return null;
    const meridiem = match[3] || null;
    if (meridiem) {
        if (hour < 1 || hour > 12) return null;
        if (hour === 12) hour = 0;
        if (meridiem === "PM") hour += 12;
    } else if (hour < 0 || hour > 23) {
        return null;
    }
    return (hour * 60) + minute;
}

function formatMinutesTo24(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatMinutesTo12(minutes) {
    const hour24 = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function buildTimeSlotVariants(range) {
    const [startRaw, endRaw] = String(range || "").split(" - ").map((item) => item.trim());
    if (!startRaw || !endRaw) {
        const trimmed = String(range || "").trim();
        return trimmed ? [trimmed] : [];
    }
    const startMinutes = parseTimeToMinutes(startRaw);
    const endMinutes = parseTimeToMinutes(endRaw);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
        const trimmed = String(range || "").trim();
        return trimmed ? [trimmed] : [];
    }
    const variants = [
        `${formatMinutesTo24(startMinutes)} - ${formatMinutesTo24(endMinutes)}`,
        `${formatMinutesTo12(startMinutes)} - ${formatMinutesTo12(endMinutes)}`
    ];
    return [...new Set(variants)];
}

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

    const timeSlotVariants = buildTimeSlotVariants(timeSlot);

    const occupiedSeats = await Reservation.countDocuments({
        lab: lab._id,
        date,
        timeSlot: timeSlotVariants.length ? { $in: timeSlotVariants } : timeSlot,
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
