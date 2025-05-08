const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const config = require('../config/auth');
const { verifySignature, deriveEncryptionKey } = require('../services/wallet.service');
const { generateToken } = require('../utils/crypto');

exports.googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email']
});

exports.googleCallback = (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, user) => {
        if (err) return next(err);
        const token = generateToken(user._id);
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })(req, res, next);
};

exports.githubAuth = passport.authenticate('github', {
    scope: ['user:email']
});

exports.githubCallback = (req, res, next) => {
    passport.authenticate('github', { session: false }, async (err, user) => {
        if (err) return next(err);
        const token = generateToken(user._id);
        res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    })(req, res, next);
};

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = await User.create({
            email,
            name,
            password: hashedPassword
        });

        const token = generateToken(user._id);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        res.status(200).json({ 
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.connectWallet = async (req, res) => {
    try {
        const { walletAddress, signature } = req.body;
        const isValid = await verifySignature(
            config.walletAuth.signatureMessage,
            signature,
            walletAddress
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid wallet signature' });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { walletAddress },
            { new: true }
        );

        res.status(200).json({
            message: 'Wallet connected',
            walletAddress: user.walletAddress
        });
    } catch (error) {
        res.status(500).json({ error: 'Error connecting wallet' });
    }
};

exports.signMessage = async (req, res) => {
    try {
        const { signature } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user.walletAddress) {
            return res.status(400).json({ error: 'No wallet connected' });
        }

        const isValid = await verifySignature(
            config.walletAuth.signatureMessage,
            signature,
            user.walletAddress
        );

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const encryptionKey = await deriveEncryptionKey(signature);
        const token = jwt.sign(
            { 
                id: user._id,
                walletVerified: true,
                encryptionKey
            },
            config.jwtSecret,
            { expiresIn: config.walletAuth.signatureExpiry }
        );

        res.status(200).json({
            message: 'Message signed',
            token
        });
    } catch (error) {
        res.status(500).json({ error: 'Error signing message' });
    }
};

exports.logout = (req, res) => {
    res.status(200).json({ message: 'Logged out' });
};