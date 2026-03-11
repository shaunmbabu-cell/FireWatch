const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reporting
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  contactInfo: {
    name: String,
    phone: String,
    email: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  fireType: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'forest', 'vehicle', 'electrical', 'other'],
    required: true
  },
  fireSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'massive'],
    required: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String
  }],
  status: {
    type: String,
    enum: ['reported', 'dispatched', 'en-route', 'on-scene', 'controlled', 'resolved'],
    default: 'reported'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resources: {
    vehicles: [String],
    personnel: [String],
    equipment: [String]
  },
  statusHistory: [{
    status: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
incidentSchema.index({ location: '2dsphere' });

// Update timestamp on save
incidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);