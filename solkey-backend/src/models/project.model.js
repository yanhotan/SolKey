const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['update_secret', 'delete_secret', 'add_secret'],
        required: true
    },
    secretId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Secret'
    },
    newValue: String,
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    environments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Environment'
    }],
    team: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['admin', 'member', 'viewer'],
            default: 'member'
        }
    }],
    changeRequests: [changeRequestSchema],
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    optimisticConcurrency: true
});

// Index for better query performance
projectSchema.index({ owner: 1, name: 1 }, { unique: true });
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;