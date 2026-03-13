const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Building = require("./Building");
const Lab = require("./Lab");
const Reservation = require("./Reservation");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/archerlabs";

const buildings = [
    { buildingCode: "GK", name: "Gokongwei Hall" },
    { buildingCode: "AG", name: "Andrew Gonzalez Hall" },
    { buildingCode: "VL", name: "Velasco Hall" },
    { buildingCode: "SJ", name: "St. Joseph Hall" }
];

const labs = [
    { code: "GK-304B", buildingCode: "GK", name: "Gokongwei 304B", capacity: 40, location: "3rd Floor, Gokongwei Hall" },
    { code: "GK-404A", buildingCode: "GK", name: "Gokongwei 404A", capacity: 45, location: "4th Floor, Gokongwei Hall" },
    { code: "AG-1904", buildingCode: "AG", name: "Andrew 1904",    capacity: 35, location: "19th Floor, Andrew Hall" },
    { code: "AG-702",  buildingCode: "AG", name: "Andrew 702",     capacity: 30, location: "7th Floor, Andrew Hall" },
    { code: "VL-201",  buildingCode: "VL", name: "Velasco 201",    capacity: 30, location: "2nd Floor, Velasco Hall" }
];

const reservations = [
    {
        studentName: "Renzel Eleydo",
        studentId:   "12345678",
        labCode:     "GK-304B",
        buildingCode:"GK",
        buildingName:"Gokongwei Hall",
        seat:        "A1",
        date:        "2026-03-13",
        timeSlot:    "09:00 - 09:30",
        status:      "Active"
    },
    {
        studentName: "Juan Dela Cruz",
        studentId:   "12345679",
        labCode:     "GK-304B",
        buildingCode:"GK",
        buildingName:"Gokongwei Hall",
        seat:        "B2",
        date:        "2026-03-13",
        timeSlot:    "09:00 - 09:30",
        status:      "Active"
    },
    {
        studentName: "Carlos Aquino",
        studentId:   "12345681",
        labCode:     "AG-1904",
        buildingCode:"AG",
        buildingName:"Andrew Gonzalez Hall",
        seat:        "D4",
        date:        "2026-03-13",
        timeSlot:    "11:00 - 11:30",
        status:      "Active"
    },
    {
        studentName: "Jean Uy",
        studentId:   "12345682",
        labCode:     "AG-702",
        buildingCode:"AG",
        buildingName:"Andrew Gonzalez Hall",
        seat:        "E5",
        date:        "2026-03-13",
        timeSlot:    "13:00 - 13:30",
        status:      "Active"
    },
    {
        studentName: "Alyssa Lim",
        studentId:   "12345684",
        labCode:     "GK-304B",
        buildingCode:"GK",
        buildingName:"Gokongwei Hall",
        seat:        "F6",
        date:        "2026-03-14",
        timeSlot:    "10:30 - 11:00",
        status:      "Active"
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        await Building.deleteMany({});
        await Lab.deleteMany({});
        await Reservation.deleteMany({});
        console.log("Cleared existing data");

        await Building.insertMany(buildings);
        console.log(`Seeded ${buildings.length} buildings`);

        await Lab.insertMany(labs);
        console.log(`Seeded ${labs.length} labs`);

        await Reservation.insertMany(reservations);
        console.log(`Seeded ${reservations.length} reservations`);

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();