const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AppError } = require('./error.middleware');
const User = require('../models/user.model');

const TOKEN_BLACKLIST = new Set();

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new AppError('No token provided', 401);
        }

        if (TOKEN_BLACKLIST.has(token)) {
            throw new AppError('Token has been revoked', 401);
        }

        jwt.verify(token, config.jwt.secret, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    throw new AppError('Token expired', 401);
                }
                if (err.name === 'JsonWebTokenError') {
                    throw new AppError('Invalid token', 401);
                }
                throw new AppError('Token verification failed', 401);
            }

            // Add user info to request
            req.user = decoded;
            next();
        });
    } catch (error) {
        next(error);
    }
};

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            walletAddress: user.walletAddress
        },
        config.jwt.secret,
        { 
            expiresIn: config.jwt.expiresIn,
            algorithm: 'HS512'  // Use stronger algorithm
        }
    );
};

const revokeToken = (token) => {
    TOKEN_BLACKLIST.add(token);
    // Implement cleanup of expired tokens from blacklist
    setTimeout(() => {
        TOKEN_BLACKLIST.delete(token);
    }, parseInt(config.jwt.expiresIn) * 1000);
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles || !req.user.roles.includes(role)) {
            throw new AppError('Insufficient permissions', 403);
        }
        next();
    };
};

const validateWalletSignature = async (req, res, next) => {
    try {
        const { walletAddress, signature, message } = req.body;
        
        if (!walletAddress || !signature || !message) {
            throw new AppError('Missing wallet authentication parameters', 400);
        }

        const solanaService = require('../services/solana.service');
        const isValid = await solanaService.validateWalletAddress(walletAddress);
        
        if (!isValid) {
            throw new AppError('Invalid wallet address', 400);
        }

        next();
    } catch (error) {
        next(error);
    }
};

const requireWallet = async (req, res, next) => {
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

const requireWalletSignature = (req, res, next) => {
    if (!req.user.walletVerified || !req.user.encryptionKey) {
        return res.status(403).json({
            message: 'Wallet signature required for encryption operations',
            code: 'SIGNATURE_REQUIRED'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    generateToken,
    revokeToken,
    requireRole,
    validateWalletSignature,
    requireWallet,
    requireWalletSignature
};