const mongoose = require('mongoose');

// Define the schema for secrets
const secretSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

// Middleware to update the updatedAt field before saving
secretSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create the model from the schema
const Secret = mongoose.model('Secret', secretSchema);

module.exports = Secret;