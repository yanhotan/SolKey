const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Route to process a payment
router.post('/process', authMiddleware.authenticate, paymentsController.processPayment);

// Route to get transaction history
router.get('/history', authMiddleware.authenticate, paymentsController.getTransactionHistory);

// Route to subscribe to a payment plan
router.post('/subscribe', authMiddleware.authenticate, paymentsController.subscribeToPlan);

module.exports = router;