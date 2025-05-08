const mongoose = require('mongoose');

// Define the schema for environments
const environmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    variables: {
        type: Map,
        of: String,
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
});

// Middleware to update the updatedAt field before saving
environmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create the model from the schema
const Environment = mongoose.model('Environment', environmentSchema);

module.exports = Environment;