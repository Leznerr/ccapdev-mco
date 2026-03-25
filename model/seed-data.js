function dateOffset(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split("T")[0];
}

const users = [
    {
        username: "renzel_eleydo",
        role: "Student",
        firstName: "Renzel",
        lastName: "Eleydo",
        email: "renzel@dlsu.edu.ph",
        bio: "CS Student | Developer",
        profilePic: "https://ui-avatars.com/api/?name=Renzel+Eleydo&background=0D8ABC&color=fff&size=128",
        password: "12345678"
    },
    {
        username: "john_doe",
        role: "Lab Technician",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@dlsu.edu.ph",
        bio: "Lab Technician, IT Support, and Loving Father",
        profilePic: "https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff&size=128",
        password: "password123"
    },
    {
        username: "bea_cantillon",
        role: "Lab Technician",
        firstName: "Bea",
        lastName: "Cantillon",
        email: "bea_cantillon@dlsu.edu.ph",
        bio: "Lab Technician | Live, Laugh, Love",
        profilePic: "https://ui-avatars.com/api/?name=Bea+Cantillon&background=random&color=fff&size=128",
        password: "password456"
    },
    {
        username: "gabrielle_enerio",
        role: "Student",
        firstName: "Gabrielle",
        lastName: "Enerio",
        email: "gabrielle_enerio@dlsu.edu.ph",
        bio: "ID124 | Aspiring Game Dev",
        profilePic: "https://ui-avatars.com/api/?name=Gabrielle+Enerio&background=random&color=fff&size=128",
        password: "abcdef123"
    },
    {
        username: "abigail_vicencio",
        role: "Student",
        firstName: "Abigail",
        lastName: "Vicencio",
        email: "abigail_vicencio@dlsu.edu.ph",
        bio: "ID124 | Interested in Human Computer Interaction",
        profilePic: "https://ui-avatars.com/api/?name=Abigail+Vicencio&background=random&color=fff&size=128",
        password: "passw0rd"
    }
];

const buildings = [
    { code: "GK", name: "Gokongwei Hall", description: "College of Computer Studies" },
    { code: "AG", name: "Andrew Gonzalez Hall", description: "General Education Labs" },
    { code: "VL", name: "Velasco Hall", description: "College of Engineering" },
    { code: "SJ", name: "St. Joseph Hall", description: "College of Science" },
    { code: "MH", name: "Miguel Hall", description: "Manufacturing and Design Labs" }
];

const labs = [
    { code: "GK-304B", buildingCode: "GK", name: "Gokongwei 304B", capacity: 40, location: "3rd Floor, Gokongwei Hall" },
    { code: "GK-404A", buildingCode: "GK", name: "Gokongwei 404A", capacity: 45, location: "4th Floor, Gokongwei Hall" },
    { code: "AG-1904", buildingCode: "AG", name: "Andrew 1904", capacity: 35, location: "19th Floor, Andrew Hall" },
    { code: "AG-702", buildingCode: "AG", name: "Andrew 702", capacity: 30, location: "7th Floor, Andrew Hall" },
    { code: "VL-201", buildingCode: "VL", name: "Velasco 201", capacity: 30, location: "2nd Floor, Velasco Hall" }
];

const reservations = [
    {
        reservationId: 2001,
        reservationGroupId: 2001,
        labCode: "GK-304B",
        seat: "A1",
        date: dateOffset(0),
        timeSlot: "09:00 - 09:30",
        reserverUsername: "renzel_eleydo",
        reservedForUsername: "renzel_eleydo",
        profileUsername: "renzel_eleydo",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (4 * 60 * 60 * 1000))
    },
    {
        reservationId: 2002,
        reservationGroupId: 2001,
        labCode: "GK-304B",
        seat: "A1",
        date: dateOffset(0),
        timeSlot: "09:30 - 10:00",
        reserverUsername: "renzel_eleydo",
        reservedForUsername: "renzel_eleydo",
        profileUsername: "renzel_eleydo",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (4 * 60 * 60 * 1000))
    },
    {
        reservationId: 2003,
        reservationGroupId: 2003,
        labCode: "GK-304B",
        seat: "B2",
        date: dateOffset(0),
        timeSlot: "10:00 - 10:30",
        reserverUsername: "john_doe",
        reservedForUsername: "john_doe",
        profileUsername: "john_doe",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (2 * 60 * 60 * 1000))
    },
    {
        reservationId: 2004,
        reservationGroupId: 2004,
        labCode: "AG-1904",
        seat: "C3",
        date: dateOffset(1),
        timeSlot: "13:00 - 13:30",
        reserverUsername: "gabrielle_enerio",
        reservedForUsername: "gabrielle_enerio",
        profileUsername: "gabrielle_enerio",
        status: "Active",
        isAnonymous: true,
        requestedAt: new Date(Date.now() - (26 * 60 * 60 * 1000))
    },
    {
        reservationId: 2005,
        reservationGroupId: 2005,
        labCode: "VL-201",
        seat: "D4",
        date: dateOffset(2),
        timeSlot: "14:30 - 15:00",
        reserverUsername: "abigail_vicencio",
        reservedForUsername: "abigail_vicencio",
        profileUsername: "abigail_vicencio",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (40 * 60 * 60 * 1000))
    }
];

module.exports = {
    users,
    buildings,
    labs,
    reservations
};
