const User = require('../models/userModel');

// get user profile by ID
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const updates = req.body;
        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// handle walk-in user registration/query
exports.handleWalkIn = async (req, res) => {
    try {
        const { name, contact } = req.body;
        const walkInUser = new User({ name, contact, isWalkIn: true });
        await walkInUser.save();
        res.status(201).json(walkInUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};