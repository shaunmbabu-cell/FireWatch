const express = require('express');
const { body, validationResult } = require('express-validator');
const FireStation = require('../models/FireStation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all fire stations
router.get('/', authenticate, async (req, res) => {
  try {
    const stations = await FireStation.find({ isActive: true }).sort({ name: 1 });
    res.json({ stations });
  } catch (error) {
    console.error('Error fetching fire stations:', error);
    res.status(500).json({ error: 'Failed to fetch fire stations' });
  }
});

// Get nearest fire station to a location
router.get('/nearest/:longitude/:latitude', authenticate, async (req, res) => {
  try {
    const { longitude, latitude } = req.params;
    
    const nearestStation = await FireStation.findOne({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          }
        }
      }
    });

    if (!nearestStation) {
      return res.status(404).json({ error: 'No fire stations found' });
    }

    // Calculate distance
    const R = 6371; // Radius of Earth in km
    const lat1 = parseFloat(latitude) * Math.PI / 180;
    const lat2 = nearestStation.location.coordinates[1] * Math.PI / 180;
    const deltaLat = (nearestStation.location.coordinates[1] - parseFloat(latitude)) * Math.PI / 180;
    const deltaLon = (nearestStation.location.coordinates[0] - parseFloat(longitude)) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    res.json({ 
      station: nearestStation,
      distance: Math.round(distance * 10) / 10 // Round to 1 decimal
    });
  } catch (error) {
    console.error('Error finding nearest station:', error);
    res.status(500).json({ error: 'Failed to find nearest station' });
  }
});

// Create fire station (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, latitude, longitude, phone, email, vehicles, personnel } = req.body;

    const station = new FireStation({
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      phone,
      email,
      vehicles: vehicles || [],
      personnel: personnel || 0
    });

    await station.save();

    res.status(201).json({
      message: 'Fire station created successfully',
      station
    });
  } catch (error) {
    console.error('Error creating fire station:', error);
    res.status(500).json({ error: 'Failed to create fire station' });
  }
});

// Update fire station (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, address, latitude, longitude, phone, email, vehicles, personnel } = req.body;
    const station = await FireStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ error: 'Fire station not found' });
    }

    if (name) station.name = name;
    if (address) station.address = address;
    if (latitude && longitude) {
      station.location.coordinates = [parseFloat(longitude), parseFloat(latitude)];
    }
    if (phone) station.phone = phone;
    if (email !== undefined) station.email = email;
    if (vehicles) station.vehicles = vehicles;
    if (personnel !== undefined) station.personnel = personnel;

    await station.save();

    res.json({
      message: 'Fire station updated successfully',
      station
    });
  } catch (error) {
    console.error('Error updating fire station:', error);
    res.status(500).json({ error: 'Failed to update fire station' });
  }
});

// Delete fire station (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const station = await FireStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({ error: 'Fire station not found' });
    }

    station.isActive = false;
    await station.save();

    res.json({ message: 'Fire station deactivated successfully' });
  } catch (error) {
    console.error('Error deleting fire station:', error);
    res.status(500).json({ error: 'Failed to delete fire station' });
  }
});

module.exports = router;