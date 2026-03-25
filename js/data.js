/* file: js/data.js */

const STORAGE_AUTH_KEY = "archerlabs_auth_v1";
const STORAGE_AUTH_USER_KEY = "archerlabs_auth_user_v1";
const SESSION_USERNAME_KEY = "currentUsername";
const SESSION_ROLE_KEY = "currentRole";
const SESSION_USER_KEY = "currentUser";
const REMEMBER_DURATION_MS = 21 * 24 * 60 * 60 * 1000;

const API_BASE = "/api";

function safeParseJSON(value, fallback) {
    if (!value) return fallback;
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch (error) {
        return fallback;
    }
}

function getRememberedAuthPayload() {
    if (typeof localStorage === "undefined") return null;
    const payload = safeParseJSON(localStorage.getItem(STORAGE_AUTH_KEY), null);
    if (!payload || !payload.username || !payload.expiresAt) return null;
    if (Date.now() > Number(payload.expiresAt)) {
        localStorage.removeItem(STORAGE_AUTH_KEY);
        localStorage.removeItem(STORAGE_AUTH_USER_KEY);
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
            localStorage.setItem(STORAGE_AUTH_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_AUTH_KEY);
            localStorage.removeItem(STORAGE_AUTH_USER_KEY);
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
        localStorage.removeItem(STORAGE_AUTH_USER_KEY);
    }
}

function loadCurrentUserFromSession() {
    let storedUser = null;
    if (typeof sessionStorage !== "undefined") {
        storedUser = safeParseJSON(sessionStorage.getItem(SESSION_USER_KEY), null);
    }
    if (storedUser) return storedUser;

    if (typeof localStorage !== "undefined" && getRememberedAuthPayload()) {
        const rememberedUser = safeParseJSON(localStorage.getItem(STORAGE_AUTH_USER_KEY), null);
        if (rememberedUser) {
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem(SESSION_USERNAME_KEY, rememberedUser.username);
                sessionStorage.setItem(SESSION_ROLE_KEY, rememberedUser.role);
                sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(rememberedUser));
            }
            return rememberedUser;
        }
    }
    return null;
}

let currentUser = loadCurrentUserFromSession();

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        const message = payload && payload.error ? payload.error : `HTTP ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        err.payload = payload;
        throw err;
    }

    return payload;
}

const api = {
    login(email, password) {
        return apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
    },
    getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/users${query ? `?${query}` : ""}`);
    },
    getUser(username) {
        return apiRequest(`/users/${encodeURIComponent(username)}`);
    },
    createUser(payload) {
        return apiRequest("/users", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    updateUser(username, payload) {
        return apiRequest(`/users/${encodeURIComponent(username)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    deleteUser(username) {
        return apiRequest(`/users/${encodeURIComponent(username)}`, {
            method: "DELETE"
        });
    },
    getBuildings() {
        return apiRequest("/buildings");
    },
    getBuildingLabs(code) {
        return apiRequest(`/buildings/${encodeURIComponent(code)}/labs`);
    },
    getLabs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/labs${query ? `?${query}` : ""}`);
    },
    getLab(code) {
        return apiRequest(`/labs/${encodeURIComponent(code)}`);
    },
    getLabAvailability(code, date, timeSlot) {
        const query = new URLSearchParams({ date, timeSlot }).toString();
        return apiRequest(`/labs/${encodeURIComponent(code)}/availability?${query}`);
    },
    getReservations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/reservations${query ? `?${query}` : ""}`);
    },
    getReservationById(reservationId) {
        return apiRequest(`/reservations/${encodeURIComponent(reservationId)}`);
    },
    getReservationGroup(groupId) {
        return apiRequest(`/reservations/group/${encodeURIComponent(groupId)}`);
    },
    createReservationGroup(payload) {
        return apiRequest("/reservations", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    updateReservation(reservationId, payload) {
        return apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    replaceReservationGroup(groupId, payload) {
        return apiRequest(`/reservations/group/${encodeURIComponent(groupId)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    deleteReservation(reservationId) {
        return apiRequest(`/reservations/${encodeURIComponent(reservationId)}`, {
            method: "DELETE"
        });
    },
    deleteReservationGroup(groupId) {
        return apiRequest(`/reservations/group/${encodeURIComponent(groupId)}`, {
            method: "DELETE"
        });
    }
};
