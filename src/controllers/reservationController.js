const Reservation = require("../../model/Reservation");
const Lab = require("../../model/Lab");
const User = require("../../model/User");

const RESERVATION_POPULATE = [
    { path: "lab", select: "code" },
    { path: "reserver", select: "username" },
    { path: "reservedFor", select: "username" },
    { path: "profileUser", select: "username" }
];

function parseBoolean(value, fallback = false) {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return fallback;
}

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

function normalizeTimeRange(range) {
    const [startRaw, endRaw] = String(range || "").split(" - ").map((item) => item.trim());
    if (!startRaw || !endRaw) return null;
    const startMinutes = parseTimeToMinutes(startRaw);
    const endMinutes = parseTimeToMinutes(endRaw);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
    return {
        startMinutes,
        endMinutes,
        start24: formatMinutesTo24(startMinutes),
        end24: formatMinutesTo24(endMinutes),
        start12: formatMinutesTo12(startMinutes),
        end12: formatMinutesTo12(endMinutes)
    };
}

function buildTimeSlotVariants(range) {
    const normalized = normalizeTimeRange(range);
    if (!normalized) {
        const trimmed = String(range || "").trim();
        return trimmed ? [trimmed] : [];
    }
    const variants = [
        `${normalized.start24} - ${normalized.end24}`,
        `${normalized.start12} - ${normalized.end12}`
    ];
    return [...new Set(variants)];
}

function canonicalizeTimeSlot(range) {
    const normalized = normalizeTimeRange(range);
    if (!normalized) return String(range || "").trim();
    return `${normalized.start12} - ${normalized.end12}`;
}

function expandSlotVariants(slots) {
    const expanded = new Set();
    (Array.isArray(slots) ? slots : []).forEach((slot) => {
        buildTimeSlotVariants(slot).forEach((variant) => expanded.add(variant));
    });
    return [...expanded];
}

function normalizeSlots(slots, timeSlot) {
    const fallback = Array.isArray(timeSlot) ? timeSlot : [timeSlot];
    const input = Array.isArray(slots) && slots.length > 0 ? slots : fallback;
    const cleaned = input
        .map((slot) => String(slot || "").trim())
        .filter((slot) => slot.length > 0);
    return [...new Set(cleaned)].sort((a, b) => a.localeCompare(b));
}

function serializeReservation(doc) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    const labCode = doc.lab && doc.lab.code ? doc.lab.code : null;
    const reserverUsername = doc.reserver && doc.reserver.username ? doc.reserver.username : null;
    const reservedForUsername = doc.reservedFor && doc.reservedFor.username
        ? doc.reservedFor.username
        : (obj.reservedForName || null);
    const profileUsername = doc.profileUser && doc.profileUser.username ? doc.profileUser.username : null;

    delete obj.lab;
    delete obj.reserver;
    delete obj.reservedFor;
    delete obj.profileUser;
    delete obj.reservedForName;

    const normalizedTimeSlot = canonicalizeTimeSlot(obj.timeSlot);

    return {
        ...obj,
        timeSlot: normalizedTimeSlot,
        labCode,
        reserverUsername,
        reservedForUsername,
        profileUsername
    };
}

async function getNextReservationId() {
    const latest = await Reservation.findOne({}).sort({ reservationId: -1 }).select("reservationId");
    return latest ? Number(latest.reservationId) + 1 : 1;
}

async function getNextGroupId() {
    const latest = await Reservation.findOne({}).sort({ reservationGroupId: -1 }).select("reservationGroupId");
    return latest ? Number(latest.reservationGroupId) + 1 : 1;
}

async function findConflicts({ labId, seat, date, slots, excludeReservationId, excludeGroupId }) {
    const expandedSlots = expandSlotVariants(slots);
    const query = {
        lab: labId,
        seat,
        date,
        timeSlot: { $in: expandedSlots.length ? expandedSlots : slots },
        status: "Active"
    };

    if (excludeReservationId !== undefined) {
        query.reservationId = { $ne: excludeReservationId };
    }

    if (excludeGroupId !== undefined) {
        query.reservationGroupId = { $ne: excludeGroupId };
    }

    return Reservation.find(query).sort({ timeSlot: 1, reservationId: 1 });
}

async function getLabByCode(code) {
    if (!code) return null;
    const normalized = String(code).trim().toUpperCase();
    if (!normalized) return null;
    return Lab.findOne({ code: normalized });
}

async function getUserByUsername(username) {
    if (!username) return null;
    const normalized = String(username).trim();
    if (!normalized) return null;
    return User.findOne({ username: normalized });
}

async function buildReservationQuery(params) {
    const query = {};

    if (params.labCode !== undefined) {
        const lab = await getLabByCode(params.labCode);
        if (!lab) return { empty: true };
        query.lab = lab._id;
    }

    if (params.seat !== undefined) {
        const seat = String(params.seat || "").trim();
        if (seat) {
            query.seat = seat.toUpperCase();
        }
    }

    if (params.date !== undefined) {
        query.date = params.date;
    }

    if (params.timeSlot !== undefined) {
        const variants = buildTimeSlotVariants(params.timeSlot);
        query.timeSlot = variants.length > 1 ? { $in: variants } : (variants[0] || params.timeSlot);
    }

    if (params.status !== undefined) {
        query.status = params.status;
    }

    if (params.reserverUsername !== undefined) {
        const user = await getUserByUsername(params.reserverUsername);
        if (!user) return { empty: true };
        query.reserver = user._id;
    }

    if (params.reservedForUsername !== undefined) {
        const raw = String(params.reservedForUsername || "").trim();
        if (raw) {
            const user = await getUserByUsername(raw);
            if (user) {
                query.reservedFor = user._id;
            } else {
                query.reservedForName = raw;
            }
        }
    }

    if (params.profileUsername !== undefined) {
        const user = await getUserByUsername(params.profileUsername);
        if (!user) return { empty: true };
        query.profileUser = user._id;
    }

    if (params.reservationGroupId !== undefined) {
        query.reservationGroupId = Number(params.reservationGroupId);
    }

    return { query, empty: false };
}

async function listReservations(req, res) {
    const { query, empty } = await buildReservationQuery(req.query);
    if (empty) {
        return res.status(200).json([]);
    }

    const reservations = await Reservation.find(query)
        .sort({ date: 1, timeSlot: 1, lab: 1, seat: 1 })
        .populate(RESERVATION_POPULATE);

    return res.status(200).json(reservations.map(serializeReservation));
}

async function getReservationById(req, res) {
    const reservationId = Number(req.params.reservationId);
    const reservation = await Reservation.findOne({ reservationId }).populate(RESERVATION_POPULATE);

    if (!reservation) {
        return res.status(404).json({ error: "Reservation not found." });
    }

    return res.status(200).json(serializeReservation(reservation));
}

async function getReservationGroup(req, res) {
    const reservationGroupId = Number(req.params.groupId);
    const reservations = await Reservation.find({ reservationGroupId })
        .sort({ timeSlot: 1, reservationId: 1 })
        .populate(RESERVATION_POPULATE);

    if (!reservations.length) {
        return res.status(404).json({ error: "Reservation group not found." });
    }

    return res.status(200).json({
        reservationGroupId,
        count: reservations.length,
        reservations: reservations.map(serializeReservation)
    });
}

async function createReservations(req, res) {
    const labCode = String(req.body.labCode).trim().toUpperCase();
    const seat = String(req.body.seat).trim().toUpperCase();
    const date = req.body.date;
    const reserverUsername = String(req.body.reserverUsername).trim();
    const reservedForProvided = Object.prototype.hasOwnProperty.call(req.body, "reservedForUsername");
    const reservedForRaw = reservedForProvided
        ? String(req.body.reservedForUsername || "").trim()
        : reserverUsername;
    const profileRaw = req.body.profileUsername ? String(req.body.profileUsername).trim() : reservedForRaw;
    const status = req.body.status || "Active";
    const isAnonymous = parseBoolean(req.body.isAnonymous, false);
    const rawSlots = normalizeSlots(req.body.slots, req.body.timeSlot);
    const slots = [...new Set(rawSlots.map(canonicalizeTimeSlot))].filter((slot) => slot.length > 0);
    const conflictSlots = expandSlotVariants(rawSlots);

    if (!slots.length) {
        return res.status(400).json({ error: "At least one time slot is required." });
    }

    const lab = await getLabByCode(labCode);
    if (!lab) {
        return res.status(404).json({ error: "Lab not found." });
    }

    const reserver = await getUserByUsername(reserverUsername);
    if (!reserver) {
        return res.status(404).json({ error: "Reserver user not found." });
    }

    if (reserver.role === "Lab Technician") {
        if (!reservedForRaw) {
            return res.status(400).json({ error: "Walk-in reservations require a student identifier." });
        }
        if (reservedForRaw === reserver.username) {
            return res.status(400).json({ error: "Walk-in reservations must be assigned to a student." });
        }
    }

    const reservedForUser = reservedForRaw
        ? (reservedForRaw === reserver.username ? reserver : await getUserByUsername(reservedForRaw))
        : null;
    const profileUser = profileRaw === reserver.username
        ? reserver
        : (profileRaw === reservedForRaw && reservedForUser ? reservedForUser : await getUserByUsername(profileRaw));

    const conflicts = await findConflicts({ labId: lab._id, seat, date, slots: conflictSlots });
    if (conflicts.length > 0) {
        return res.status(409).json({
            error: "Reservation conflict. One or more slots are already booked.",
            conflicts
        });
    }

    const reservationGroupId = req.body.reservationGroupId
        ? Number(req.body.reservationGroupId)
        : await getNextGroupId();
    let nextReservationId = await getNextReservationId();

    const reservedForName = reservedForUser ? null : (reservedForRaw ? String(reservedForRaw).trim() : null);

    const docs = slots.map((timeSlot) => {
        const document = {
            reservationId: nextReservationId,
            reservationGroupId,
            lab: lab._id,
            seat,
            date,
            timeSlot,
            reserver: reserver._id,
            reservedFor: reservedForUser ? reservedForUser._id : null,
            reservedForName,
            profileUser: profileUser ? profileUser._id : null,
            status,
            isAnonymous,
            requestedAt: req.body.requestedAt ? new Date(req.body.requestedAt) : new Date()
        };
        nextReservationId += 1;
        return document;
    });

    const created = await Reservation.insertMany(docs, { ordered: true });
    const populated = await Reservation.populate(created, RESERVATION_POPULATE);

    return res.status(201).json({
        reservationGroupId,
        count: created.length,
        reservations: populated.map(serializeReservation)
    });
}

async function updateReservationById(req, res) {
    const reservationId = Number(req.params.reservationId);
    const reservation = await Reservation.findOne({ reservationId });

    if (!reservation) {
        return res.status(404).json({ error: "Reservation not found." });
    }

    let nextLab = null;
    if (req.body.labCode) {
        nextLab = await getLabByCode(req.body.labCode);
        if (!nextLab) {
            return res.status(404).json({ error: "Lab not found." });
        }
    }

    const nextLabId = nextLab ? nextLab._id : reservation.lab;
    const nextSeat = req.body.seat ? String(req.body.seat).trim().toUpperCase() : reservation.seat;
    const nextDate = req.body.date || reservation.date;
    const nextTimeSlot = canonicalizeTimeSlot(req.body.timeSlot || reservation.timeSlot);
    const nextStatus = req.body.status || reservation.status;

    if (nextStatus === "Active") {
        const conflicts = await findConflicts({
            labId: nextLabId,
            seat: nextSeat,
            date: nextDate,
            slots: [nextTimeSlot],
            excludeReservationId: reservationId
        });
        if (conflicts.length > 0) {
            return res.status(409).json({
                error: "Reservation conflict. Target slot is already booked.",
                conflicts
            });
        }
    }

    if (nextLab) {
        reservation.lab = nextLab._id;
    }
    reservation.seat = nextSeat;
    reservation.date = nextDate;
    reservation.timeSlot = nextTimeSlot;
    reservation.status = nextStatus;

    if (req.body.reserverUsername) {
        const reserver = await getUserByUsername(req.body.reserverUsername);
        if (!reserver) {
            return res.status(404).json({ error: "Reserver user not found." });
        }
        reservation.reserver = reserver._id;
    }

    if (req.body.reservedForUsername !== undefined) {
        const raw = String(req.body.reservedForUsername || "").trim();
        if (!raw) {
            reservation.reservedFor = null;
            reservation.reservedForName = null;
        } else {
            const reservedFor = await getUserByUsername(raw);
            reservation.reservedFor = reservedFor ? reservedFor._id : null;
            reservation.reservedForName = reservedFor ? null : raw;
        }
    }

    if (req.body.profileUsername !== undefined) {
        const raw = String(req.body.profileUsername || "").trim();
        if (!raw) {
            reservation.profileUser = null;
        } else {
            const profileUser = await getUserByUsername(raw);
            reservation.profileUser = profileUser ? profileUser._id : null;
        }
    }

    if (req.body.isAnonymous !== undefined) {
        reservation.isAnonymous = parseBoolean(req.body.isAnonymous, reservation.isAnonymous);
    }

    await reservation.save();
    const populated = await Reservation.findOne({ reservationId }).populate(RESERVATION_POPULATE);
    return res.status(200).json(serializeReservation(populated));
}

async function replaceReservationGroup(req, res) {
    const reservationGroupId = Number(req.params.groupId);
    const groupReservations = await Reservation.find({ reservationGroupId }).sort({ reservationId: 1 });

    if (!groupReservations.length) {
        return res.status(404).json({ error: "Reservation group not found." });
    }

    const base = groupReservations[0];

    let lab = null;
    if (req.body.labCode) {
        lab = await getLabByCode(req.body.labCode);
        if (!lab) {
            return res.status(404).json({ error: "Lab not found." });
        }
    }

    let reserver = null;
    if (req.body.reserverUsername) {
        reserver = await getUserByUsername(req.body.reserverUsername);
        if (!reserver) {
            return res.status(404).json({ error: "Reserver user not found." });
        }
    }

    const labId = lab ? lab._id : base.lab;
    const seat = req.body.seat ? String(req.body.seat).trim().toUpperCase() : base.seat;
    const date = req.body.date || base.date;
    const status = req.body.status || base.status || "Active";
    const isAnonymous = parseBoolean(
        Object.prototype.hasOwnProperty.call(req.body, "isAnonymous") ? req.body.isAnonymous : base.isAnonymous,
        base.isAnonymous
    );
    const rawSlots = normalizeSlots(req.body.slots, req.body.timeSlot || groupReservations.map((item) => item.timeSlot));
    const slots = [...new Set(rawSlots.map(canonicalizeTimeSlot))].filter((slot) => slot.length > 0);
    const conflictSlots = expandSlotVariants(rawSlots);

    if (!slots.length) {
        return res.status(400).json({ error: "At least one time slot is required." });
    }

    let reservedForId = base.reservedFor || null;
    let reservedForName = base.reservedForName || null;
    if (Object.prototype.hasOwnProperty.call(req.body, "reservedForUsername")) {
        const raw = String(req.body.reservedForUsername || "").trim();
        if (!raw) {
            reservedForId = null;
            reservedForName = null;
        } else {
            const reservedForUser = await getUserByUsername(raw);
            reservedForId = reservedForUser ? reservedForUser._id : null;
            reservedForName = reservedForUser ? null : raw;
        }
    }

    let profileUserId = base.profileUser || null;
    if (Object.prototype.hasOwnProperty.call(req.body, "profileUsername")) {
        const raw = String(req.body.profileUsername || "").trim();
        if (!raw) {
            profileUserId = null;
        } else {
            const profileUser = await getUserByUsername(raw);
            profileUserId = profileUser ? profileUser._id : null;
        }
    }

    const conflicts = await findConflicts({
        labId,
        seat,
        date,
        slots: conflictSlots,
        excludeGroupId: reservationGroupId
    });
    if (conflicts.length > 0) {
        return res.status(409).json({
            error: "Reservation conflict. One or more target slots are already booked.",
            conflicts
        });
    }

    await Reservation.deleteMany({ reservationGroupId });
    let nextReservationId = await getNextReservationId();

    const newDocs = slots.map((timeSlot) => {
        const document = {
            reservationId: nextReservationId,
            reservationGroupId,
            lab: labId,
            seat,
            date,
            timeSlot,
            reserver: reserver ? reserver._id : base.reserver,
            reservedFor: reservedForId,
            reservedForName,
            profileUser: profileUserId,
            status,
            isAnonymous,
            requestedAt: base.requestedAt || new Date()
        };
        nextReservationId += 1;
        return document;
    });

    const saved = await Reservation.insertMany(newDocs, { ordered: true });
    const populated = await Reservation.populate(saved, RESERVATION_POPULATE);

    return res.status(200).json({
        reservationGroupId,
        count: saved.length,
        reservations: populated.map(serializeReservation)
    });
}

async function deleteReservationById(req, res) {
    const reservationId = Number(req.params.reservationId);
    const deleted = await Reservation.findOneAndDelete({ reservationId });

    if (!deleted) {
        return res.status(404).json({ error: "Reservation not found." });
    }

    return res.status(200).json({ message: "Reservation deleted successfully." });
}

async function deleteReservationGroup(req, res) {
    const reservationGroupId = Number(req.params.groupId);
    const deletion = await Reservation.deleteMany({ reservationGroupId });

    if (deletion.deletedCount === 0) {
        return res.status(404).json({ error: "Reservation group not found." });
    }

    return res.status(200).json({
        message: "Reservation group deleted successfully.",
        deletedCount: deletion.deletedCount
    });
}

module.exports = {
    listReservations,
    getReservationById,
    getReservationGroup,
    createReservations,
    updateReservationById,
    replaceReservationGroup,
    deleteReservationById,
    deleteReservationGroup
};
