const mongoose = require('mongoose');

const fireStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
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
    }
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  vehicles: [{
    type: String
  }],
  personnel: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create geospatial index for location queries
fireStationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FireStation', fireStationSchema);