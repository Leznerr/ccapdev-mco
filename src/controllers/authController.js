const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// secret key for jwt
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // generate JWT
        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
};