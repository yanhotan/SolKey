// Payments Controller
// This controller handles payment-related requests, including subscription processing and transaction history.

const Payment = require('../models/payment.model');
const { processSubscription, getTransactionHistory } = require('../services/wallet.service');

// Process a subscription payment
exports.processPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        const payment = await processSubscription(paymentData);
        res.status(201).json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get transaction history for a user
exports.getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is available in req.user
        const transactions = await getTransactionHistory(userId);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};