const Payment = require('../models/payment.model');
const { processSubscription, getTransactionHistory } = require('../services/wallet.service');
const { getPlanAmount, getPlanDetails } = require('../config/subscription');

exports.processPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        const payment = await processSubscription(paymentData);
        res.status(201).json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        const transactions = await getTransactionHistory(req.user.id);
        res.status(200).json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.subscribeToPlan = async (req, res) => {
    try {
        const { planId, walletAddress } = req.body;
        const plan = getPlanDetails(planId);
        
        const payment = new Payment({
            userId: req.user.id,
            amount: plan.amount,
            currency: 'SOL',
            paymentMethod: 'wallet',
            status: 'pending'
        });

        await payment.save();

        res.status(200).json({
            success: true,
            payment: {
                id: payment._id,
                amount: payment.amount,
                currency: payment.currency,
                walletAddress,
                plan: {
                    id: plan.id,
                    name: plan.name,
                    features: plan.features
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};