const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/process', authenticateToken, paymentsController.processPayment);
router.get('/history', authenticateToken, paymentsController.getTransactionHistory);
router.post('/subscribe', authenticateToken, paymentsController.subscribeToPlan);

module.exports = router;