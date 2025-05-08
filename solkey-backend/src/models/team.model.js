const mongoose = require('mongoose');

// Define the schema for team members
const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the updatedAt field before saving
teamSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create the model from the schema
const Team = mongoose.model('Team', teamSchema);

module.exports = Team;