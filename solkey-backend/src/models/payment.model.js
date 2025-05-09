const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['SOL'],
    default: 'SOL'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true
  },
  subscriptionType: {
    type: String,
    enum: ['basic', 'pro'],
    required: true
  },
  duration: {
    type: Number,  // Duration in months
    required: true
  },
  metadata: {
    network: {
      type: String,
      enum: ['mainnet', 'devnet'],
      default: 'devnet'
    },
    senderAddress: String,
    signature: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;