const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, requireWallet } = require('../middleware/auth.middleware');
const config = require('../config/auth');

// Only add OAuth routes if configured
if (config.oauth?.google?.clientId) {
  router.get('/google', authController.googleAuth);
  router.get('/google/callback', authController.googleCallback);
}

if (config.oauth?.github?.clientId) {
  router.get('/github', authController.githubAuth);
  router.get('/github/callback', authController.githubCallback);
}

// Standard auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);

// Wallet routes
router.post('/wallet/connect', authenticateToken, authController.connectWallet);
router.post('/wallet/sign', authenticateToken, requireWallet, authController.signMessage);

module.exports = router;