const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    type: {
        type: String,
        enum: ['development', 'staging', 'production', 'custom'],
        default: 'development'
    },
    secrets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Secret'
    }],
    description: {
        type: String
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure unique environment names within a project
environmentSchema.index({ projectId: 1, name: 1 }, { unique: true });

// Basic validation to ensure project exists
environmentSchema.pre('save', async function(next) {
    const Project = mongoose.model('Project');
    try {
        const project = await Project.findById(this.projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        next();
    } catch (error) {
        next(error);
    }
});

const Environment = mongoose.model('Environment', environmentSchema);
module.exports = Environment;