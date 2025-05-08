const mongoose = require('mongoose');

// Define the schema for a project
const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    secrets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Secret'
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
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create the model from the schema
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;