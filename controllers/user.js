const User = require('../models/userDetails');
const jwt = require('jsonwebtoken');
const Audit = require('../models/audit');
const moment = require('moment-timezone'); // Import moment-timezone

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

// Function to get the current IST time and return both Date and formatted string
// Function to get the current IST time and return both Date and formatted string
const getISTTime = () => {
    const istTime = moment.tz('Asia/Kolkata');  // Get current time in IST
    return {
        istDate: istTime.toDate(),  // Save as a Date object (it will be saved in UTC in MongoDB)
        istFormatted: istTime.format('DD-MM-YYYY hh:mm A'),  // Save formatted IST string
        startOfDayIST: istTime.clone().startOf('day').toDate(),  // Start of the day in IST as Date
        endOfDayIST: istTime.clone().endOf('day').toDate()  // End of the day in IST as Date
    };
};

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

        // Get current IST time (both Date object and formatted string)
        const { istDate, istFormatted, startOfDayIST, endOfDayIST } = getISTTime();

        // Check if the user has already logged in today
        const existingLogin = await Audit.findOne({
            username,
            loginTime: { $gte: startOfDayIST, $lt: endOfDayIST } // Look for a login in today's range
        });

        if (!existingLogin) {
            // If no login for today exists, create a new document
                await Audit.create({
                    username,
                    loginTime: istDate,
                    firstPickupTime: null, // Place this before lastUpdatedStatusTime
                    lastUpdatedStatusTime: null
                });
        }

        // Send the token and formatted login time
        res.status(200).json({ token, loginTime: istFormatted }); // Send the formatted IST login time in response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    registerUser,
    loginUser
};