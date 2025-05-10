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
        trim: true,
        maxlength: 100,
        unique: true
    },
    description: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500
    },
    nonce: {
        type: String,
        required: false
    },    walletSignature: {
        type: String,
        required: false, // Changed to false since we want to allow projects without signatures initially
        trim: true,
        validate: {
            validator: function(v) {
                // Allow undefined/null but if present must be at least 32 chars
                return !v || v.length >= 32;
            },
            message: 'Wallet signature if provided must be at least 32 characters long'
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
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
    timestamps: true
});

// Add text search index for name and description
projectSchema.index({ name: 'text', description: 'text' });

// Add unique index for project name
projectSchema.index({ name: 1 }, { unique: true });

// Pre-save middleware to trim strings
projectSchema.pre('save', function(next) {
    if (this.name) this.name = this.name.trim();
    if (this.description) this.description = this.description.trim();
    if (this.walletSignature) this.walletSignature = this.walletSignature.trim();
    next();
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;