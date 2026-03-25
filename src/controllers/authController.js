const User = require("../../model/User");

function sanitizeUser(userDoc) {
    if (!userDoc) return null;
    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete user.password;
    return user;
}

async function login(req, res) {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.status(200).json(sanitizeUser(user));
}

module.exports = {
    login
};
