const mongoose = require('mongoose');
const User = require('./user.model');
const Project = require('./project.model');

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

// Compound index to ensure unique environment names within a project
environmentSchema.index({ projectId: 1, name: 1 }, { unique: true });

// Middleware to validate custom environment creation based on subscription
environmentSchema.pre('save', async function(next) {
    if (this.type === 'custom') {
        const project = await Project.findById(this.projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        const owner = await User.findById(project.owner);
        if (!owner) {
            throw new Error('Project owner not found');
        }

        if (owner.subscription.type !== 'pro') {
            throw new Error('Custom environments are only available for pro plan users');
        }
    }
    next();
});

const Environment = mongoose.model('Environment', environmentSchema);
module.exports = Environment;