/* file: js/data.js */

// Mock user list (para sa demo)
const users = [
    {
        username: "renzel_eleydo",
        role: "Student",
        firstName: "Renzel",
        lastName: "Eleydo",
        email: "renzel@dlsu.edu.ph",
        bio: "CS Student | Developer",
        // Generates an avatar with initials 'RE' and a specific background color (use this api below)
        profilePic: "https://ui-avatars.com/api/?name=Renzel+Eleydo&background=0D8ABC&color=fff&size=128",
        // TEMPORARY PASSWORD STORAGE
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
        bio: "ID 124 | Aspiring Game Dev",
        profilePic: "https://ui-avatars.com/api/?name=Gabrielle+Enerio&background=random&color=fff&size=128",
        password: "abcdef123"
    },
    {
        username: "abigail_vicencio",
        role: "Student",
        firstName: "Abigail",
        lastName: "Vicencio",
        email: "abigail_vicencio@dlsu.edu.ph",
        bio: "Student :I :) :D",
        profilePic: "https://ui-avatars.com/api/?name=Abigail+Vicencio&background=random&color=fff&size=128",
        password: "passw0rd"
    },

];

// Buildings catalog
const buildings = [
    {
        id: "GK",
        name: "Gokongwei Hall",
        description: "College of Computer Studies"
    },
    {
        id: "AG",
        name: "Andrew Gonzalez Hall",
        description: "General Education Labs",
    },
    {
        id: "VL",
        name: "Velasco Hall",
        description: "College of Engineering",
    },
    {
        id: "SJ",
        name: "St. Joseph Hall",
        description: "College of Science",
    },
    {
        id: "MH",
        name: "Miguel Hall",
        description: "Manufacturing and Design Labs",
    }
];

// Labs per building
const labs = [
    // GOKONGWEI LABS
    { 
        id: "GK-304B", 
        buildingId: "GK", 
        name: "Gokongwei 304B", 
        capacity: 40, 
        location: "3rd Floor, Gokongwei Hall"
    },
    { 
        id: "GK-404A", 
        buildingId: "GK", 
        name: "Gokongwei 404A", 
        capacity: 45, 
        location: "4th Floor, Gokongwei Hall"
    },
    
    // ANDREW LABS
    { 
        id: "AG-1904", 
        buildingId: "AG", 
        name: "Andrew 1904", 
        capacity: 35, 
        location: "19th Floor, Andrew Hall"
    },
    { 
        id: "AG-702", 
        buildingId: "AG", 
        name: "Andrew 702", 
        capacity: 30, 
        location: "7th Floor, Andrew Hall",
    },

    // VELASCO LABS
    { 
        id: "VL-201", 
        buildingId: "VL", 
        name: "Velasco 201", 
        capacity: 30, 
        location: "2nd Floor, Velasco Hall"
    }
];

// Sample reservations (active only)
const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

const reservations = [
    // Renzel's Active Booking
    { 
        id: 101, 
        lab: "GK-304B", 
        seat: "A1", 
        date: today, 
        time: "09:00 - 09:30", 
        reserver: "renzel_eleydo", 
        status: "Active",
        isAnonymous: false 
    },
    // John Doe (Occupied)
    { 
        id: 102, 
        lab: "GK-304B", 
        seat: "B2", 
        date: today, 
        time: "09:00 - 09:30", 
        reserver: "john_doe", 
        status: "Active",
        isAnonymous: false 
    },
    // Anonymous User
    { 
        id: 103, 
        lab: "GK-304B", 
        seat: "C3", 
        date: today, 
        time: "09:00 - 09:30", 
        reserver: "anon_user", 
        status: "Active",
        isAnonymous: true 
    }
];

// Simulated session (just change the role to Student instead of Technician to switch modes):
// 1) use saved username/role if available
// 2) fallback to a student account for default demo flow
let currentUser = null;

if (typeof sessionStorage !== "undefined") {
    const savedUsername = sessionStorage.getItem("currentUsername");
    const savedRole = sessionStorage.getItem("currentRole");

    currentUser =
        users.find(user => user.username === savedUsername) ||
        users.find(user => user.role === savedRole);
}

if (!currentUser) {
    currentUser = users.find(user => user.role === "Student");
}
