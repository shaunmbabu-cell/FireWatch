import React, { useState, useEffect, useCallback } from 'react';
import { incidentsAPI, usersAPI, fireStationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './IncidentDetails.css';

const IncidentDetails = ({ incident, onClose }) => {
  const { isAdmin, isResponder } = useAuth();
  const [currentIncident, setCurrentIncident] = useState(incident);
  const [responders, setResponders] = useState([]);
  const [selectedResponders, setSelectedResponders] = useState([]);
  const [newStatus, setNewStatus] = useState(incident.status);
  const [statusNotes, setStatusNotes] = useState('');
  const [resources, setResources] = useState({
    vehicles: incident.resources?.vehicles?.join(', ') || '',
    personnel: incident.resources?.personnel?.join(', ') || '',
    equipment: incident.resources?.equipment?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [nearestStation, setNearestStation] = useState(null);

  const fetchResponders = async () => {
    try {
      const response = await usersAPI.getResponders();
      setResponders(response.data.responders);
    } catch (error) {
      console.error('Error fetching responders:', error);
    }
  };

  const fetchNearestStation = useCallback(async () => {
    try {
      const [lon, lat] = currentIncident.location.coordinates;
      const response = await fireStationsAPI.getNearest(lon, lat);
      setNearestStation(response.data);
    } catch (error) {
      console.error('Error fetching nearest station:', error);
    }
  }, [currentIncident.location.coordinates]);

  useEffect(() => {
    if (isAdmin) {
      fetchResponders();
    }
    if (isResponder) {
      fetchNearestStation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isResponder, fetchNearestStation]);

  const handleStatusUpdate = async () => {
    if (newStatus === currentIncident.status && !statusNotes) {
      setMessage({ type: 'error', text: 'No changes to update' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await incidentsAPI.updateStatus(currentIncident._id, {
        status: newStatus,
        notes: statusNotes
      });

      const response = await incidentsAPI.getById(currentIncident._id);
      setCurrentIncident(response.data.incident);
      setStatusNotes('');
      setMessage({ type: 'success', text: 'Status updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update status' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignResponders = async () => {
    if (selectedResponders.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one responder' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await incidentsAPI.assignResponders(currentIncident._id, selectedResponders);
      const response = await incidentsAPI.getById(currentIncident._id);
      setCurrentIncident(response.data.incident);
      setSelectedResponders([]);
      setMessage({ type: 'success', text: 'Responders assigned successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to assign responders' });
    } finally {
      setLoading(false);
    }
  };

  const handleResourceUpdate = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Convert comma-separated strings to arrays
      const resourceData = {
        vehicles: resources.vehicles.split(',').map(item => item.trim()).filter(item => item),
        personnel: resources.personnel.split(',').map(item => item.trim()).filter(item => item),
        equipment: resources.equipment.split(',').map(item => item.trim()).filter(item => item)
      };

      await incidentsAPI.updateResources(currentIncident._id, resourceData);
      const response = await incidentsAPI.getById(currentIncident._id);
      setCurrentIncident(response.data.incident);
      
      // Update local state with the saved values
      setResources({
        vehicles: response.data.incident.resources?.vehicles?.join(', ') || '',
        personnel: response.data.incident.resources?.personnel?.join(', ') || '',
        equipment: response.data.incident.resources?.equipment?.join(', ') || ''
      });
      
      setMessage({ type: 'success', text: 'Resources updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update resources' });
    } finally {
      setLoading(false);
    }
  };

  const handleResourceChange = (type, value) => {
    setResources({
      ...resources,
      [type]: value
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'reported': '#ffc107',
      'dispatched': '#ff9800',
      'en-route': '#2196f3',
      'on-scene': '#9c27b0',
      'controlled': '#4caf50',
      'resolved': '#8bc34a'
    };
    return colors[status] || '#999';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal incident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Incident Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Basic Information */}
          <section className="detail-section">
            <h3 className="section-heading">📋 Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Fire Type:</span>
                <span className="detail-value">{currentIncident.fireType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fire Size:</span>
                <span className="detail-value">{currentIncident.fireSize}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span
                  className={`status-badge status-${currentIncident.status}`}
                  style={{ backgroundColor: getStatusColor(currentIncident.status) }}
                >
                  {currentIncident.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Priority:</span>
                <span className={`priority-badge priority-${currentIncident.priority}`}>
                  {currentIncident.priority}
                </span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{currentIncident.location.address}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coordinates:</span>
                <span className="detail-value">
                  {currentIncident.location.coordinates[1]}, {currentIncident.location.coordinates[0]}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Reported:</span>
                <span className="detail-value">
                  {new Date(currentIncident.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="detail-section">
            <h3 className="section-heading">📝 Description</h3>
            <p className="incident-description">{currentIncident.description}</p>
          </section>

          {/* Contact Information */}
          {!currentIncident.isAnonymous && currentIncident.contactInfo && (
            <section className="detail-section">
              <h3 className="section-heading">📞 Contact Information</h3>
              <div className="detail-grid">
                {currentIncident.contactInfo.name && (
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{currentIncident.contactInfo.name}</span>
                  </div>
                )}
                {currentIncident.contactInfo.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{currentIncident.contactInfo.phone}</span>
                  </div>
                )}
                {currentIncident.contactInfo.email && (
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{currentIncident.contactInfo.email}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Route Optimization */}
          {isResponder && nearestStation && (
            <section className="detail-section">
              <h3 className="section-heading">🚒 Route from Nearest Station</h3>
              <div className="route-info">
                <div className="station-card">
                  <div className="station-header">
                    <h4>{nearestStation.station.name}</h4>
                    <span className="distance-badge">
                      {nearestStation.distance} km away
                    </span>
                  </div>
                  <p className="station-address">{nearestStation.station.address}</p>
                  <p className="station-phone">📞 {nearestStation.station.phone}</p>
                </div>

                <div className="route-actions">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${nearestStation.station.location.coordinates[1]},${nearestStation.station.location.coordinates[0]}&destination=${currentIncident.location.coordinates[1]},${currentIncident.location.coordinates[0]}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    🗺️ Open in Google Maps
                  </a>
                  <a
                    href={`https://www.waze.com/ul?ll=${currentIncident.location.coordinates[1]},${currentIncident.location.coordinates[0]}&navigate=yes&from=${nearestStation.station.location.coordinates[1]},${nearestStation.station.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    🚗 Open in Waze
                  </a>
                </div>

                <div className="route-details">
                  <div className="route-point">
                    <span className="route-icon start">🏢</span>
                    <div>
                      <strong>From:</strong>
                      <p>{nearestStation.station.name}</p>
                    </div>
                  </div>
                  <div className="route-arrow">→</div>
                  <div className="route-point">
                    <span className="route-icon end">🔥</span>
                    <div>
                      <strong>To:</strong>
                      <p>{currentIncident.location.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Media */}
          {currentIncident.media && currentIncident.media.length > 0 && (
            <section className="detail-section">
              <h3 className="section-heading">📸 Media</h3>
              <div className="media-grid">
                {currentIncident.media.map((media, index) => (
                  <div key={index} className="media-item">
                    {media.type === 'image' ? (
                      <img
                        src={`http://localhost:5000${media.url}`}
                        alt={`Incident media ${index + 1}`}
                        className="media-image"
                      />
                    ) : (
                      <video
                        src={`http://localhost:5000${media.url}`}
                        controls
                        className="media-video"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Assigned Responders */}
          {currentIncident.assignedTo && currentIncident.assignedTo.length > 0 && (
            <section className="detail-section">
              <h3 className="section-heading">👥 Assigned Responders</h3>
              <div className="responder-list">
                {currentIncident.assignedTo.map((responder) => (
                  <div key={responder._id} className="responder-item">
                    <span className="responder-name">{responder.name}</span>
                    <span className="responder-email">{responder.email}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resources */}
          {isResponder && (
            <section className="detail-section">
              <h3 className="section-heading">🚒 Resources</h3>
              <div className="form-group">
                <label>Vehicles (comma-separated)</label>
                <textarea
                  className="form-control"
                  placeholder="Engine 1, Ladder 2, Ambulance 3"
                  value={resources.vehicles}
                  onChange={(e) => handleResourceChange('vehicles', e.target.value)}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Personnel (comma-separated)</label>
                <textarea
                  className="form-control"
                  placeholder="John Doe, Jane Smith"
                  value={resources.personnel}
                  onChange={(e) => handleResourceChange('personnel', e.target.value)}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Equipment (comma-separated)</label>
                <textarea
                  className="form-control"
                  placeholder="Hoses, Axes, Breathing apparatus"
                  value={resources.equipment}
                  onChange={(e) => handleResourceChange('equipment', e.target.value)}
                  rows="2"
                />
              </div>
              <button
                onClick={handleResourceUpdate}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Resources'}
              </button>
            </section>
          )}

          {/* Status Update */}
          {isResponder && (
            <section className="detail-section">
              <h3 className="section-heading">🔄 Update Status</h3>
              <div className="form-group">
                <label>New Status</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="reported">Reported</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="en-route">En Route</option>
                  <option value="on-scene">On Scene</option>
                  <option value="controlled">Controlled</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-control"
                  placeholder="Add notes about the status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows="3"
                ></textarea>
              </div>
              <button
                onClick={handleStatusUpdate}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </section>
          )}

          {/* Assign Responders (Admin only) */}
          {isAdmin && (
            <section className="detail-section">
              <h3 className="section-heading">➕ Assign Responders</h3>
              
              {/* Currently Assigned */}
              {currentIncident.assignedTo && currentIncident.assignedTo.length > 0 && (
                <div className="assigned-responders-display">
                  <p className="assigned-label">Currently Assigned:</p>
                  <div className="assigned-badges">
                    {currentIncident.assignedTo.map((responder) => (
                      <span key={responder._id} className="responder-badge">
                        👤 {responder.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Responder Selection with Checkboxes */}
              <div className="form-group">
                <label>Select Responders to Assign:</label>
                <div className="responders-checkbox-list">
                  {responders.length === 0 ? (
                    <p className="no-responders">No responders available</p>
                  ) : (
                    responders.map((responder) => {
                      const isAssigned = currentIncident.assignedTo?.some(
                        assigned => assigned._id === responder._id
                      );
                      const isSelected = selectedResponders.includes(responder._id);
                      
                      return (
                        <label 
                          key={responder._id} 
                          className={`responder-checkbox-item ${isAssigned ? 'already-assigned' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResponders([...selectedResponders, responder._id]);
                              } else {
                                setSelectedResponders(
                                  selectedResponders.filter(id => id !== responder._id)
                                );
                              }
                            }}
                            className="responder-checkbox"
                          />
                          <div className="responder-info">
                            <span className="responder-name">
                              {responder.name}
                              {isAssigned && <span className="assigned-tag">✓ Assigned</span>}
                            </span>
                            <span className="responder-email">{responder.email}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <small className="form-text">
                  {selectedResponders.length === 0 
                    ? 'Select responders to assign to this incident'
                    : `${selectedResponders.length} responder(s) selected`
                  }
                </small>
              </div>
              
              <div className="assign-actions">
                <button
                  onClick={handleAssignResponders}
                  className="btn btn-primary"
                  disabled={loading || selectedResponders.length === 0}
                >
                  {loading ? 'Assigning...' : `Assign ${selectedResponders.length || ''} Responder(s)`}
                </button>
                {selectedResponders.length > 0 && (
                  <button
                    onClick={() => setSelectedResponders([])}
                    className="btn btn-secondary"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Status History */}
          {currentIncident.statusHistory && currentIncident.statusHistory.length > 0 && (
            <section className="detail-section">
              <h3 className="section-heading">📜 Status History</h3>
              <div className="history-timeline">
                {currentIncident.statusHistory.map((history, index) => (
                  <div key={index} className="history-item">
                    <div className="history-marker"></div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className={`status-badge status-${history.status}`}>
                          {history.status}
                        </span>
                        <span className="history-time">
                          {new Date(history.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {history.updatedBy && (
                        <p className="history-user">Updated by: {history.updatedBy.name}</p>
                      )}
                      {history.notes && (
                        <p className="history-notes">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;