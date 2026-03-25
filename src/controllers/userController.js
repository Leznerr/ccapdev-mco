const User = require("../../model/User");
const Reservation = require("../../model/Reservation");

function sanitizeUser(userDoc) {
    if (!userDoc) return null;
    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete user.password;
    return user;
}

async function listUsers(req, res) {
    const role = req.query.role;
    const query = {};

    if (role) {
        query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: 1 });
    return res.status(200).json(users.map(sanitizeUser));
}

async function getUserByUsername(req, res) {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(sanitizeUser(user));
}

async function createUser(req, res) {
    const payload = {
        username: req.body.username,
        role: req.body.role,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        bio: req.body.bio || "",
        profilePic: req.body.profilePic || "",
        password: req.body.password
    };

    const user = await User.create(payload);
    return res.status(201).json(sanitizeUser(user));
}

async function updateUser(req, res) {
    const { username } = req.params;
    const allowed = [
        "role",
        "firstName",
        "lastName",
        "email",
        "bio",
        "profilePic",
        "password"
    ];

    const updatePayload = {};
    allowed.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            updatePayload[field] = req.body[field];
        }
    });

    const user = await User.findOneAndUpdate(
        { username },
        { $set: updatePayload },
        { new: true, runValidators: true }
    );

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json(sanitizeUser(user));
}

async function deleteUser(req, res) {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    const activeReservations = await Reservation.countDocuments({
        profileUser: user._id,
        status: "Active"
    });

    if (activeReservations > 0) {
        return res.status(400).json({
            error: "Cannot delete user with active reservations.",
            activeReservations
        });
    }

    await User.deleteOne({ username });
    return res.status(200).json({ message: "User deleted successfully." });
}

module.exports = {
    listUsers,
    getUserByUsername,
    createUser,
    updateUser,
    deleteUser
};
