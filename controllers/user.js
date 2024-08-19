const User = require('../models/userDetails');
const jwt = require('jsonwebtoken');

// Hardcoded JWT secret key (use this only for development/testing)
// const JWT_SECRET = 'your_secret_key'; // Replace 'your_secret_key' with a strong secret key
const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            password, // Directly storing the password without hashing
        });

        // Save user to database
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Check if password matches
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
    loginUser
};