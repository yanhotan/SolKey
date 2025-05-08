const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken, requireWallet } = require('../middleware/auth.middleware');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);

router.post('/wallet/connect', authenticateToken, authController.connectWallet);
router.post('/wallet/sign', authenticateToken, requireWallet, authController.signMessage);

module.exports = router;