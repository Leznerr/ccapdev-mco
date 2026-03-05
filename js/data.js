/* file: js/data.js */

const STORAGE_USERS_KEY = "archerlabs_users_v1";
const STORAGE_RESERVATIONS_KEY = "archerlabs_reservations_v1";
const STORAGE_AUTH_KEY = "archerlabs_auth_v1";
const SESSION_USERNAME_KEY = "currentUsername";
const SESSION_ROLE_KEY = "currentRole";
const SESSION_USER_KEY = "currentUser";
const REMEMBER_DURATION_MS = 21 * 24 * 60 * 60 * 1000;

function safeParseJSON(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch (err) {
        return fallback;
    }
}

function dateOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
}

const seededUsers = [
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

const seededReservations = [
    {
        id: 2001,
        reservationGroupId: 2001,
        lab: "GK-304B",
        seat: "A1",
        date: dateOffset(0),
        time: "09:00 - 09:30",
        reserver: "renzel_eleydo",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (4 * 60 * 60 * 1000)).toISOString()
    },
    {
        id: 2002,
        reservationGroupId: 2001,
        lab: "GK-304B",
        seat: "A1",
        date: dateOffset(0),
        time: "09:30 - 10:00",
        reserver: "renzel_eleydo",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (4 * 60 * 60 * 1000)).toISOString()
    },
    {
        id: 2003,
        reservationGroupId: 2003,
        lab: "GK-304B",
        seat: "B2",
        date: dateOffset(0),
        time: "10:00 - 10:30",
        reserver: "john_doe",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString()
    },
    {
        id: 2004,
        reservationGroupId: 2004,
        lab: "AG-1904",
        seat: "C3",
        date: dateOffset(1),
        time: "13:00 - 13:30",
        reserver: "gabrielle_enerio",
        status: "Active",
        isAnonymous: true,
        requestedAt: new Date(Date.now() - (26 * 60 * 60 * 1000)).toISOString()
    },
    {
        id: 2005,
        reservationGroupId: 2005,
        lab: "VL-201",
        seat: "D4",
        date: dateOffset(2),
        time: "14:30 - 15:00",
        reserver: "abigail_vicencio",
        status: "Active",
        isAnonymous: false,
        requestedAt: new Date(Date.now() - (40 * 60 * 60 * 1000)).toISOString()
    }
];

function normalizeReservation(reservation, index) {
    const id = Number(reservation.id) || (Date.now() + index);
    const groupId = reservation.reservationGroupId || id;
    const reservedForUsername = Object.prototype.hasOwnProperty.call(reservation, "reservedForUsername")
        ? reservation.reservedForUsername
        : reservation.reserver;
    const profileUsername = Object.prototype.hasOwnProperty.call(reservation, "profileUsername")
        ? reservation.profileUsername
        : reservedForUsername;
    return {
        ...reservation,
        id,
        reservationGroupId: groupId,
        status: reservation.status || "Active",
        isAnonymous: !!reservation.isAnonymous,
        requestedAt: reservation.requestedAt || new Date().toISOString(),
        reservedForUsername,
        profileUsername
    };
}

function loadUsers() {
    if (typeof localStorage === "undefined") {
        return seededUsers.map(user => ({ ...user }));
    }
    const stored = safeParseJSON(localStorage.getItem(STORAGE_USERS_KEY), null);
    if (Array.isArray(stored) && stored.length) {
        return stored;
    }
    const fallback = seededUsers.map(user => ({ ...user }));
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(fallback));
    return fallback;
}

function loadReservations() {
    if (typeof localStorage === "undefined") {
        return seededReservations.map(normalizeReservation);
    }
    const stored = safeParseJSON(localStorage.getItem(STORAGE_RESERVATIONS_KEY), null);
    if (Array.isArray(stored) && stored.length) {
        const normalized = stored.map(normalizeReservation);
        localStorage.setItem(STORAGE_RESERVATIONS_KEY, JSON.stringify(normalized));
        return normalized;
    }
    const fallback = seededReservations.map(normalizeReservation);
    localStorage.setItem(STORAGE_RESERVATIONS_KEY, JSON.stringify(fallback));
    return fallback;
}

const users = loadUsers();
const reservations = loadReservations();

function saveUsers() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function saveReservations() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_RESERVATIONS_KEY, JSON.stringify(reservations.map(normalizeReservation)));
}

function getRememberedAuthPayload() {
    if (typeof localStorage === "undefined") return null;
    const payload = safeParseJSON(localStorage.getItem(STORAGE_AUTH_KEY), null);
    if (!payload || !payload.username || !payload.expiresAt) return null;
    if (Date.now() > Number(payload.expiresAt)) {
        localStorage.removeItem(STORAGE_AUTH_KEY);
        return null;
    }
    return payload;
}

function setAuthSession(user, remember) {
    if (!user) return;

    if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(SESSION_USERNAME_KEY, user.username);
        sessionStorage.setItem(SESSION_ROLE_KEY, user.role);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    if (typeof localStorage !== "undefined") {
        if (remember) {
            localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({
                username: user.username,
                expiresAt: Date.now() + REMEMBER_DURATION_MS
            }));
        } else {
            localStorage.removeItem(STORAGE_AUTH_KEY);
        }
    }
}

function getAuthSession() {
    let sessionUsername = null;
    if (typeof sessionStorage !== "undefined") {
        sessionUsername = sessionStorage.getItem(SESSION_USERNAME_KEY);
        if (!sessionUsername) {
            const storedUser = safeParseJSON(sessionStorage.getItem(SESSION_USER_KEY), null);
            if (storedUser && storedUser.username) {
                sessionUsername = storedUser.username;
            }
        }
    }

    const rememberedPayload = getRememberedAuthPayload();
    if (sessionUsername) {
        return {
            username: sessionUsername,
            remember: !!(rememberedPayload && rememberedPayload.username === sessionUsername)
        };
    }
    if (rememberedPayload) {
        return {
            username: rememberedPayload.username,
            remember: true
        };
    }
    return null;
}

function clearAuthSession() {
    if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(SESSION_USERNAME_KEY);
        sessionStorage.removeItem(SESSION_ROLE_KEY);
        sessionStorage.removeItem(SESSION_USER_KEY);
    }
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_AUTH_KEY);
    }
}

function refreshRememberSessionIfNeeded() {
    const auth = getAuthSession();
    if (!auth || !auth.username) return null;

    const user = users.find(u => u.username === auth.username) || null;
    if (!user) {
        clearAuthSession();
        return null;
    }

    if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(SESSION_USERNAME_KEY, user.username);
        sessionStorage.setItem(SESSION_ROLE_KEY, user.role);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    }

    if (auth.remember && typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify({
            username: user.username,
            expiresAt: Date.now() + REMEMBER_DURATION_MS
        }));
    }

    return user;
}

// Buildings catalog
const buildings = [
    { id: "GK", name: "Gokongwei Hall", description: "College of Computer Studies" },
    { id: "AG", name: "Andrew Gonzalez Hall", description: "General Education Labs" },
    { id: "VL", name: "Velasco Hall", description: "College of Engineering" },
    { id: "SJ", name: "St. Joseph Hall", description: "College of Science" },
    { id: "MH", name: "Miguel Hall", description: "Manufacturing and Design Labs" }
];

// Labs per building
const labs = [
    { id: "GK-304B", buildingId: "GK", name: "Gokongwei 304B", capacity: 40, location: "3rd Floor, Gokongwei Hall" },
    { id: "GK-404A", buildingId: "GK", name: "Gokongwei 404A", capacity: 45, location: "4th Floor, Gokongwei Hall" },
    { id: "AG-1904", buildingId: "AG", name: "Andrew 1904", capacity: 35, location: "19th Floor, Andrew Hall" },
    { id: "AG-702", buildingId: "AG", name: "Andrew 702", capacity: 30, location: "7th Floor, Andrew Hall" },
    { id: "VL-201", buildingId: "VL", name: "Velasco 201", capacity: 30, location: "2nd Floor, Velasco Hall" }
];

let currentUser = refreshRememberSessionIfNeeded();
