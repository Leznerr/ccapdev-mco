require("dotenv").config();

const { connectDB, disconnectDB } = require("../model/db");
const User = require("../model/User");
const Building = require("../model/Building");
const Lab = require("../model/Lab");
const Reservation = require("../model/Reservation");
const { users, buildings, labs, reservations } = require("../model/seed-data");

async function seedDatabase() {
    await connectDB();

    await Promise.all([
        User.deleteMany({}),
        Building.deleteMany({}),
        Lab.deleteMany({}),
        Reservation.deleteMany({})
    ]);

    const createdUsers = await User.insertMany(users);
    await Building.insertMany(buildings);
    const createdLabs = await Lab.insertMany(labs);

    const userByUsername = new Map(createdUsers.map((user) => [user.username, user]));
    const labByCode = new Map(createdLabs.map((lab) => [lab.code, lab]));

    const reservationDocs = reservations.map((reservation) => {
        const lab = labByCode.get(reservation.labCode);
        const reserver = userByUsername.get(reservation.reserverUsername);
        const reservedForRaw = reservation.reservedForUsername || reservation.reserverUsername;
        const profileRaw = reservation.profileUsername || reservedForRaw;
        const reservedFor = reservedForRaw ? userByUsername.get(reservedForRaw) : null;
        const profileUser = profileRaw ? userByUsername.get(profileRaw) : null;

        if (!lab) {
            throw new Error(`Seed error: lab not found for code ${reservation.labCode}`);
        }
        if (!reserver) {
            throw new Error(`Seed error: user not found for reserver ${reservation.reserverUsername}`);
        }

        return {
            reservationId: reservation.reservationId,
            reservationGroupId: reservation.reservationGroupId,
            lab: lab._id,
            seat: reservation.seat,
            date: reservation.date,
            timeSlot: reservation.timeSlot,
            reserver: reserver._id,
            reservedFor: reservedFor ? reservedFor._id : null,
            reservedForName: reservedFor ? null : (reservedForRaw || null),
            profileUser: profileUser ? profileUser._id : null,
            status: reservation.status,
            isAnonymous: reservation.isAnonymous,
            requestedAt: reservation.requestedAt ? new Date(reservation.requestedAt) : new Date()
        };
    });

    await Reservation.insertMany(reservationDocs);

    console.log("Database seeded successfully.");
    console.log(`Users: ${users.length}`);
    console.log(`Buildings: ${buildings.length}`);
    console.log(`Labs: ${labs.length}`);
    console.log(`Reservations: ${reservations.length}`);
}

seedDatabase()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnectDB();
    });
