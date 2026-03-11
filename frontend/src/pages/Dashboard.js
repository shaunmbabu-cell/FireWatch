import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { incidentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import { requestNotificationPermission, notifyNewIncident } from '../services/pushNotifications';
import IncidentDetails from '../components/IncidentDetails';
import './Dashboard.css';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom fire marker icon
const fireIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">' +
      '<path d="M16 0 C16 0 30 20 30 28 C30 34.627 23.732 40 16 40 C8.268 40 2 34.627 2 28 C2 20 16 0 16 0Z" fill="#d32f2f"/>' +
      '<path d="M16 12 C16 12 23 22 23 27 C23 30.866 19.866 34 16 34 C12.134 34 9 30.866 9 27 C9 22 16 12 16 12Z" fill="#ff9800"/>' +
      '<path d="M16 20 C16 20 19.5 24 19.5 26.5 C19.5 28.433 17.933 30 16 30 C14.067 30 12.5 28.433 12.5 26.5 C12.5 24 16 20 16 20Z" fill="#ffeb3b"/>' +
    '</svg>'
  ),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40]
});

// Green fire icon for resolved incidents
const resolvedFireIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40" width="32" height="40">' +
      '<path d="M16 0 C16 0 30 20 30 28 C30 34.627 23.732 40 16 40 C8.268 40 2 34.627 2 28 C2 20 16 0 16 0Z" fill="#4caf50"/>' +
      '<path d="M16 12 C16 12 23 22 23 27 C23 30.866 19.866 34 16 34 C12.134 34 9 30.866 9 27 C9 22 16 12 16 12Z" fill="#66bb6a"/>' +
      '<path d="M16 20 C16 20 19.5 24 19.5 26.5 C19.5 28.433 17.933 30 16 30 C14.067 30 12.5 28.433 12.5 26.5 C12.5 24 16 20 16 20Z" fill="#81c784"/>' +
    '</svg>'
  ),
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40]
});

const Dashboard = () => {
  const { user, isAdmin, isResponder } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    fireType: ''
  });
  const [view, setView] = useState('map'); // 'map' or 'list'

  useEffect(() => {
    fetchIncidents();
    if (isAdmin) {
      fetchStats();
    }

    // Request notification permission for responders
    if (isResponder) {
      requestNotificationPermission();
    }

    // Setup real-time updates
    const handleNewIncident = (data) => {
      console.log('New incident received:', data);
      fetchIncidents();
      if (isAdmin) fetchStats();
      
      // Show push notification
      if (isResponder) {
        notifyNewIncident(data.incident);
      }
    };

    const handleIncidentUpdate = (data) => {
      console.log('Incident updated:', data);
      fetchIncidents();
      
      // You can optionally show notification for updates too
      // notifyStatusUpdate(data.incident, data.status);
    };

    socketService.on('newIncident', handleNewIncident);
    socketService.on('incidentUpdate', handleIncidentUpdate);

    return () => {
      socketService.off('newIncident', handleNewIncident);
      socketService.off('incidentUpdate', handleIncidentUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    let filtered = [...incidents];

    if (filters.status) {
      filtered = filtered.filter(inc => inc.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(inc => inc.priority === filters.priority);
    }
    if (filters.fireType) {
      filtered = filtered.filter(inc => inc.fireType === filters.fireType);
    }

    setFilteredIncidents(filtered);
  }, [incidents, filters]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentsAPI.getAll();
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await incidentsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      fireType: ''
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

  const getPriorityColor = (priority) => {
    const colors = {
      'low': '#4caf50',
      'medium': '#ff9800',
      'high': '#ff5722',
      'critical': '#d32f2f'
    };
    return colors[priority] || '#999';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">🚒 Emergency Response Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back, {user.name}</p>
        </div>
        <div className="header-actions">
          <button
            className={`btn ${view === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('map')}
          >
            🗺️ Map View
          </button>
          <button
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >
            📋 List View
          </button>
        </div>
      </div>

      {/* Statistics Cards (Admin only) */}
      {isAdmin && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Incidents</div>
            </div>
          </div>
          <div className="stat-card active">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active Incidents</div>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-panel">
        <h3 className="filters-title">Filters</h3>
        <div className="filters-grid">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-control"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="dispatched">Dispatched</option>
            <option value="en-route">En Route</option>
            <option value="on-scene">On Scene</option>
            <option value="controlled">Controlled</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            className="form-control"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <select
            name="fireType"
            value={filters.fireType}
            onChange={handleFilterChange}
            className="form-control"
          >
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="forest">Forest</option>
            <option value="vehicle">Vehicle</option>
            <option value="electrical">Electrical</option>
            <option value="other">Other</option>
          </select>

          {(filters.status || filters.priority || filters.fireType) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Map View */}
      {view === 'map' && (
        <div className="map-container">
          <div className="map-info">
            <p>
              {filters.status === 'resolved' ? (
                <>Showing {filteredIncidents.length} resolved incidents on map</>
              ) : (
                <>
                  Showing {filteredIncidents.filter(i => i.status !== 'resolved').length} active incidents on map
                  {filteredIncidents.filter(i => i.status === 'resolved').length > 0 && (
                    <span className="resolved-count">
                      ({filteredIncidents.filter(i => i.status === 'resolved').length} resolved incidents hidden - select "Resolved" filter to view)
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          <MapContainer
            center={[20.5937, 78.9629]} // Center of India
            zoom={5}
            style={{ height: '600px', width: '100%', borderRadius: '12px' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredIncidents
              .filter(incident => filters.status === 'resolved' ? true : incident.status !== 'resolved')
              .map((incident) => (
              <Marker
                key={incident._id}
                position={[
                  incident.location.coordinates[1],
                  incident.location.coordinates[0]
                ]}
                icon={incident.status === 'resolved' ? resolvedFireIcon : fireIcon}
                eventHandlers={{
                  click: () => setSelectedIncident(incident)
                }}
              >
                <Popup>
                  <div className="map-popup">
                    <h4>{incident.fireType} Fire</h4>
                    <p><strong>Size:</strong> {incident.fireSize}</p>
                    <p><strong>Status:</strong> <span style={{ color: getStatusColor(incident.status) }}>{incident.status}</span></p>
                    <p><strong>Priority:</strong> <span style={{ color: getPriorityColor(incident.priority) }}>{incident.priority}</span></p>
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: '8px' }}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="incidents-list">
          {filteredIncidents.length === 0 ? (
            <div className="no-incidents">
              <p>No incidents found matching your filters.</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident._id}
                className="incident-card"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="incident-header">
                  <h3 className="incident-title">
                    {incident.fireType.toUpperCase()} FIRE
                  </h3>
                  <div className="incident-badges">
                    <span className={`status-badge status-${incident.status}`}>
                      {incident.status}
                    </span>
                    <span className={`priority-badge priority-${incident.priority}`}>
                      {incident.priority}
                    </span>
                  </div>
                </div>
                <div className="incident-info">
                  <p><strong>📍 Location:</strong> {incident.location.address}</p>
                  <p><strong>🔥 Size:</strong> {incident.fireSize}</p>
                  <p><strong>📅 Reported:</strong> {new Date(incident.createdAt).toLocaleString()}</p>
                  <p><strong>📝 Description:</strong> {incident.description.substring(0, 100)}...</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncident && (
        <IncidentDetails
          incident={selectedIncident}
          onClose={() => {
            setSelectedIncident(null);
            fetchIncidents(); // Refresh after closing
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;