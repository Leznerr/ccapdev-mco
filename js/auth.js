// file: js/auth.js

/* =========================================
   1. VALIDATION FUNCTIONS
   ========================================= */
// email format
function isValidEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@dlsu\.edu\.ph$/;
    return emailRegex.test(normalized);
}

// password strength
function isValidPassword(password) {
    return password.length >= 8;
}

/* =========================================
   2. FORM HANDLERS
   ========================================= */

// initialize form handlers
function initializeFormHandlers() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // only attach listeners if not already attached
    if (loginForm && !loginForm.dataset.listenerAttached) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        loginForm.dataset.listenerAttached = 'true';
    }
    
    if (registerForm && !registerForm.dataset.listenerAttached) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        registerForm.dataset.listenerAttached = 'true';
    }
}

// login form submission handler
function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid DLSU email');
        return;
    }
    
    // simulate authentication
    authenticateUser(email, password, remember);
}

// register form submission handler
function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const type = document.getElementById('type').value;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword || !type) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid DLSU email');
        return;
    }
    
    if (!isValidPassword(password)) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (users.some(u => String(u.email).toLowerCase() === email.toLowerCase())) {
        alert('This email is already registered. Please log in instead.');
        return;
    }
    
    // create user account
    createUser(firstName, lastName, email, password, type);
}

// initialize on page load
document.addEventListener('DOMContentLoaded', initializeFormHandlers);


/* =========================================
   3. AUTHENTICATION FUNCTIONS
   ========================================= */
// authentication logic
function authenticateUser(email, password, remember) {
    // check against users array from data.js
    const normalizedEmail = email.toLowerCase();
    const user = users.find(u => String(u.email).toLowerCase() === normalizedEmail);
    
    if (user) {
        if (password === user.password) {
            if (typeof setAuthSession === 'function') {
                setAuthSession(user, remember);
            } else {
                sessionStorage.setItem('currentUsername', user.username);
                sessionStorage.setItem('currentRole', user.role);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            }
            redirectToDashboard(user);
        } else {
            alert('Invalid password');
        }
    } else {
        alert('Email not found. Please check your email or register a new account.');
    }
}

// create new user to data.js (simulate registration)
function createUser(firstName, lastName, email, password, type) {
    const normalizedType = String(type || "").trim().toLowerCase();
    const role = (normalizedType === "lab-technician" || normalizedType === "lab technician")
        ? "Lab Technician"
        : "Student";
    const emailUser = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
    let username = emailUser;
    let counter = 1;
    while (users.some(u => u.username === username)) {
        counter += 1;
        username = `${emailUser}_${counter}`;
    }

    const newUser = {
        username,
        role,
        firstName,
        lastName,
        email: email.toLowerCase(),
        bio: "New ArcherLabs user.",
        profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${firstName} ${lastName}`)}&background=387C44&color=fff&size=128`,
        password
    };

    users.push(newUser);
    if (typeof saveUsers === 'function') {
        saveUsers();
    }
    
    alert('Account created successfully! Please log in.');
    redirectToLogin();
}

// on success
function redirectToDashboard(user) {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    if (user.role === 'Lab Technician') {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    if (user.role === 'Student') {
        window.location.href = 'index.html';
        return;
    }

    window.location.href = 'index.html';
}

function redirectToLogin() {
    window.location.href = 'login.html';
}
