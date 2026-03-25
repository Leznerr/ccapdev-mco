// file: js/auth.js

function isValidEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@dlsu\.edu\.ph$/;
    return emailRegex.test(normalized);
}

function isValidPassword(password) {
    return String(password || "").length >= 8;
}

function initializeFormHandlers() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm && !loginForm.dataset.listenerAttached) {
        loginForm.addEventListener("submit", handleLoginSubmit);
        loginForm.dataset.listenerAttached = "true";
    }

    if (registerForm && !registerForm.dataset.listenerAttached) {
        registerForm.addEventListener("submit", handleRegisterSubmit);
        registerForm.dataset.listenerAttached = "true";
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember")?.checked || false;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }
    if (!isValidEmail(email)) {
        alert("Please enter a valid DLSU email");
        return;
    }

    try {
        const authenticatedUser = await api.login(email, password);
        setAuthSession(authenticatedUser, remember);
        currentUser = authenticatedUser;
        redirectToDashboard(authenticatedUser);
    } catch (error) {
        console.error(error);
        if (error.status === 401) {
            alert("Invalid email or password.");
            return;
        }
        alert("Unable to log in right now. Please try again.");
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const type = document.getElementById("type").value;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !type) {
        alert("Please fill in all fields");
        return;
    }
    if (!isValidEmail(email)) {
        alert("Please enter a valid DLSU email");
        return;
    }
    if (!isValidPassword(password)) {
        alert("Password must be at least 8 characters");
        return;
    }
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {
        const existingUsers = await api.getUsers();
        if (existingUsers.some((user) => String(user.email).toLowerCase() === email.toLowerCase())) {
            alert("This email is already registered. Please log in instead.");
            return;
        }

        const normalizedType = String(type || "").trim().toLowerCase();
        const role = (normalizedType === "lab-technician" || normalizedType === "lab technician")
            ? "Lab Technician"
            : "Student";
        const emailUser = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");

        let username = emailUser;
        let counter = 1;
        while (existingUsers.some((user) => user.username === username)) {
            counter += 1;
            username = `${emailUser}_${counter}`;
        }

        await api.createUser({
            username,
            role,
            firstName,
            lastName,
            email: email.toLowerCase(),
            bio: "New ArcherLabs user.",
            profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=387C44&color=fff&size=128`,
            password
        });

        alert("Account created successfully! Please log in.");
        redirectToLogin();
    } catch (error) {
        console.error(error);
        if (error.status === 409 || error.status === 400) {
            alert("Username or email already exists.");
            return;
        }
        alert("Unable to register right now. Please try again.");
    }
}

// ----------------------------------------------------
// UPDATED REDIRECTS: Removed .html for Express routes
// ----------------------------------------------------

function redirectToDashboard(user) {
    if (!user) {
        window.location.href = "/";
        return;
    }
    if (user.role === "Lab Technician") {
        window.location.href = "/admin-dashboard";
        return;
    }
    if (user.role === "Student") {
        window.location.href = "/";
        return;
    }
    window.location.href = "/";
}

function redirectToLogin() {
    window.location.href = "/login";
}

document.addEventListener("DOMContentLoaded", initializeFormHandlers);