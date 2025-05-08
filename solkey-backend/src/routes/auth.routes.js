const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route for user registration
router.post('/register', authController.register);

// Route for user login
router.post('/login', authController.login);

// Route for user logout
router.post('/logout', authMiddleware.verifyToken, authController.logout);

// Route for connecting a wallet
router.post('/connect-wallet', authMiddleware.verifyToken, authController.connectWallet);

// Export the router
module.exports = router;