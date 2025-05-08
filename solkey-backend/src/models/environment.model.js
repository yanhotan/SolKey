const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    variables: {
        type: Map,
        of: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

environmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Environment', environmentSchema);