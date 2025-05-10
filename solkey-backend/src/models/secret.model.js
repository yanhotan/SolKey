const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  encryptedValue: {
    type: String,
    required: true
  },
  nonce: {
    type: String,
    required: true
  },
  walletSignature: {
    type: String,
    required: false
  },
  environmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Environment',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  previousVersions: [{
    value: String,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Ensure unique keys within an environment
secretSchema.index({ environmentId: 1, key: 1 }, { unique: true });

// Add version tracking middleware
secretSchema.pre('save', function(next) {
  if (this.isModified('encryptedValue')) {
    this.version += 1;
    if (this.lastModifiedBy) {
      this.previousVersions.push({
        value: this.encryptedValue,
        modifiedAt: new Date(),
        modifiedBy: this.lastModifiedBy
      });
    }
  }
  next();
});

const Secret = mongoose.model('Secret', secretSchema);
module.exports = Secret;