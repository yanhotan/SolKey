// Import necessary modules and services
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/crypto');

// Login function
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout function
exports.logout = (req, res) => {
    // Invalidate the token (implementation depends on the strategy used)
    res.status(200).json({ message: 'Logged out successfully' });
};

// Wallet connection function
exports.connectWallet = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.walletAddress = walletAddress;
        await user.save();

        res.status(200).json({ message: 'Wallet connected successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};