const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const User = require('../models/user.model');

exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }
};

exports.requireWallet = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user.walletAddress) {
            return res.status(403).json({ 
                message: 'Wallet connection required',
                code: 'WALLET_REQUIRED'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.requireWalletSignature = (req, res, next) => {
    if (!req.user.walletVerified || !req.user.encryptionKey) {
        return res.status(403).json({
            message: 'Wallet signature required for encryption operations',
            code: 'SIGNATURE_REQUIRED'
        });
    }
    next();
};