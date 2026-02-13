// file: js/auth.js

/* =========================================
   1. VALIDATION FUNCTIONS
   ========================================= */
// email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }
    
    // simulate authentication
    authenticateUser(email, password);
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
        alert('Please enter a valid email');
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
    
    // create user account
    createUser(firstName, lastName, email, password, type);
}

// initialize on page load
document.addEventListener('DOMContentLoaded', initializeFormHandlers);


/* =========================================
   3. AUTHENTICATION FUNCTIONS
   ========================================= */
// authentication logic
function authenticateUser(email, password) {
    // check against users array from data.js
    const user = users.find(u => u.email === email);
    
    if (user) {
        if (password === user.password) {
            // set logged-in user in sessionStorage (simulate login)
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            redirectToDashboard();
        } else {
            alert('Invalid password');
        }
    } else {
        alert('Email not found. Please check your email or register a new account.');
    }
}

// create new user to data.js (simulate registration)
function createUser(firstName, lastName, email, password, type) {
    // add new user to users array or send to server
    
    alert('Account created successfully! Please log in.');
    redirectToLogin();
}

// on success
function redirectToDashboard() {
    window.location.href = 'admin-dashboard.html';
}

function redirectToLogin() {
    window.location.href = 'login.html';
}