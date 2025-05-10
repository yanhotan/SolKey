const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Temporarily removed authentication for testing
router.post('/process', paymentsController.processPayment);
router.get('/history', paymentsController.getTransactionHistory);
router.post('/subscribe', paymentsController.subscribeToPlan);

module.exports = router;