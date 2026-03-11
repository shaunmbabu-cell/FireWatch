const express = require('express');
const { body, validationResult } = require('express-validator');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendFireAlert, sendStatusUpdate } = require('../services/notification');

const router = express.Router();

// Report new incident (public or authenticated)
router.post('/report', upload.array('media', 5), [
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('address').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('fireType').isIn(['residential', 'commercial', 'industrial', 'forest', 'vehicle', 'electrical', 'other']),
  body('fireSize').isIn(['small', 'medium', 'large', 'massive']),
  body('isAnonymous').optional().isBoolean(),
  body('contactName').optional().trim(),
  body('contactPhone').optional().trim(),
  body('contactEmail').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      latitude,
      longitude,
      address,
      description,
      fireType,
      fireSize,
      isAnonymous,
      contactName,
      contactPhone,
      contactEmail
    } = req.body;

    // Determine priority based on fire size
    let priority = 'medium';
    if (fireSize === 'massive') priority = 'critical';
    else if (fireSize === 'large') priority = 'high';
    else if (fireSize === 'small') priority = 'low';

    // Create incident
    const incident = new Incident({
      reportedBy: req.user ? req.user._id : null,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      contactInfo: {
        name: contactName || (req.user ? req.user.name : ''),
        phone: contactPhone || (req.user ? req.user.phone : ''),
        email: contactEmail || (req.user ? req.user.email : '')
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address
      },
      description,
      fireType,
      fireSize,
      priority,
      media: req.files ? req.files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'video',
        url: `/uploads/${file.filename}`
      })) : []
    });

    await incident.save();

    // Get all admins and responders for notification
    const responders = await User.find({
      role: { $in: ['admin', 'responder'] },
      isActive: true
    });

    // Send notifications (non-blocking)
    sendFireAlert(incident, responders).catch(err => 
      console.error('Error sending alerts:', err)
    );

    // Emit real-time notification via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('newIncident', {
        incident: {
          id: incident._id,
          location: incident.location,
          fireType: incident.fireType,
          fireSize: incident.fireSize,
          priority: incident.priority,
          status: incident.status,
          createdAt: incident.createdAt
        }
      });
    }

    res.status(201).json({
      message: 'Incident reported successfully',
      incident: {
        id: incident._id,
        status: incident.status,
        createdAt: incident.createdAt
      }
    });
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

// Get all incidents (responders only)
router.get('/', authenticate, authorize('admin', 'responder'), async (req, res) => {
  try {
    const { status, priority, fireType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (fireType) query.fireType = fireType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Get single incident
router.get('/:id', authenticate, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('statusHistory.updatedBy', 'name');

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check if user has permission to view
    if (req.user.role === 'user' && 
        (!incident.reportedBy || incident.reportedBy._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Update incident status (responders only)
router.put('/:id/status', authenticate, authorize('admin', 'responder'), [
  body('status').isIn(['reported', 'dispatched', 'en-route', 'on-scene', 'controlled', 'resolved']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Update status
    const previousStatus = incident.status;
    incident.status = status;
    
    // Add to status history
    incident.statusHistory.push({
      status,
      updatedBy: req.user._id,
      notes,
      timestamp: new Date()
    });

    // If resolved, set resolvedAt
    if (status === 'resolved') {
      incident.resolvedAt = new Date();
    }

    await incident.save();

    // Send notification if reporter is not anonymous
    if (incident.reportedBy && !incident.isAnonymous) {
      const reporter = await User.findById(incident.reportedBy);
      if (reporter) {
        sendStatusUpdate(incident, reporter).catch(err =>
          console.error('Error sending status update:', err)
        );
      }
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('incidentUpdate', {
        incidentId: incident._id,
        status,
        updatedBy: req.user.name
      });
    }

    res.json({
      message: 'Status updated successfully',
      incident: {
        id: incident._id,
        status: incident.status,
        previousStatus
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Assign responders to incident (admin only)
router.put('/:id/assign', authenticate, authorize('admin'), [
  body('responderIds').isArray()
], async (req, res) => {
  try {
    const { responderIds } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Verify all responders exist
    const responders = await User.find({
      _id: { $in: responderIds },
      role: { $in: ['admin', 'responder'] }
    });

    if (responders.length !== responderIds.length) {
      return res.status(400).json({ error: 'Invalid responder IDs' });
    }

    incident.assignedTo = responderIds;
    await incident.save();

    // Notify assigned responders
    for (const responder of responders) {
      const subject = 'Fire Incident Assignment';
      const html = `
        <p>You have been assigned to a fire incident at ${incident.location.address}.</p>
        <p><strong>Type:</strong> ${incident.fireType}</p>
        <p><strong>Size:</strong> ${incident.fireSize}</p>
        <p><strong>Priority:</strong> ${incident.priority}</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/incidents/${incident._id}">View Details</a>
      `;
      const { sendEmail } = require('../services/notification');
      sendEmail(responder.email, subject, html).catch(err =>
        console.error('Error sending assignment email:', err)
      );
    }

    res.json({
      message: 'Responders assigned successfully',
      assignedTo: responders.map(r => ({ id: r._id, name: r.name }))
    });
  } catch (error) {
    console.error('Error assigning responders:', error);
    res.status(500).json({ error: 'Failed to assign responders' });
  }
});

// Update incident resources (responders only)
router.put('/:id/resources', authenticate, authorize('admin', 'responder'), async (req, res) => {
  try {
    const { vehicles, personnel, equipment } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (vehicles) incident.resources.vehicles = vehicles;
    if (personnel) incident.resources.personnel = personnel;
    if (equipment) incident.resources.equipment = equipment;

    await incident.save();

    res.json({
      message: 'Resources updated successfully',
      resources: incident.resources
    });
  } catch (error) {
    console.error('Error updating resources:', error);
    res.status(500).json({ error: 'Failed to update resources' });
  }
});

// Get incidents near location (for map visualization)
router.get('/nearby/:longitude/:latitude', authenticate, authorize('admin', 'responder'), async (req, res) => {
  try {
    const { longitude, latitude } = req.params;
    const maxDistance = req.query.radius || 50000; // 50km default

    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).limit(100);

    res.json({ incidents });
  } catch (error) {
    console.error('Error fetching nearby incidents:', error);
    res.status(500).json({ error: 'Failed to fetch nearby incidents' });
  }
});

// Get incident statistics (admin only)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({
      status: { $in: ['reported', 'dispatched', 'en-route', 'on-scene', 'controlled'] }
    });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    
    const incidentsByType = await Incident.aggregate([
      { $group: { _id: '$fireType', count: { $sum: 1 } } }
    ]);

    const incidentsByPriority = await Incident.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalIncidents,
      active: activeIncidents,
      resolved: resolvedIncidents,
      byType: incidentsByType,
      byPriority: incidentsByPriority
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;