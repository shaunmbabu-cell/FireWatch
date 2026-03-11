import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fireStationsAPI } from '../services/api';
import './FireStations.css';

const FireStations = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    personnel: '',
    vehicles: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchLocation, setSearchLocation] = useState({
    city: '',
    radius: '50' // km
  });
  const [discoveredStations, setDiscoveredStations] = useState([]);
  const [showDiscovery, setShowDiscovery] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchStations();
  }, [isAdmin, navigate]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await fireStationsAPI.getAll();
      setStations(response.data.stations);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setMessage({ type: 'error', text: 'Failed to load fire stations' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        phone: formData.phone,
        email: formData.email,
        personnel: parseInt(formData.personnel) || 0,
        vehicles: formData.vehicles.split(',').map(v => v.trim()).filter(v => v)
      };

      await fireStationsAPI.create(data);
      
      setMessage({ type: 'success', text: 'Fire station added successfully!' });
      setShowForm(false);
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        personnel: '',
        vehicles: ''
      });
      
      fetchStations();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to add fire station' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this fire station?')) {
      return;
    }

    try {
      await fireStationsAPI.delete(id);
      setMessage({ type: 'success', text: 'Fire station deactivated' });
      fetchStations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to deactivate station' });
    }
  };

  const searchAddress = async () => {
    if (!formData.address) {
      setMessage({ type: 'error', text: 'Please enter an address first' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setFormData({
          ...formData,
          latitude: result.lat,
          longitude: result.lon,
          address: result.display_name
        });
        setMessage({ type: 'success', text: 'Address found! Coordinates filled automatically.' });
      } else {
        setMessage({ type: 'error', text: 'Address not found. Please enter coordinates manually.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to search address' });
    } finally {
      setLoading(false);
    }
  };

  const autoDiscoverStations = async () => {
    if (!searchLocation.city) {
      setMessage({ type: 'error', text: 'Please enter a city or location' });
      return;
    }

    setLoading(true);
    setMessage({ type: 'info', text: 'Searching for fire stations in your area...' });
    
    try {
      // Step 1: Get coordinates of the search location
      const locationResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation.city)}`
      );
      const locationData = await locationResponse.json();
      
      if (!locationData || locationData.length === 0) {
        setMessage({ type: 'error', text: 'Location not found. Try a different city name.' });
        setLoading(false);
        return;
      }

      const { lat, lon } = locationData[0];
      
      // Step 2: Search for fire stations using Overpass API (OpenStreetMap)
      const radius = parseInt(searchLocation.radius) * 1000; // Convert km to meters
      const query = `
        [out:json];
        (
          node["amenity"="fire_station"](around:${radius},${lat},${lon});
          way["amenity"="fire_station"](around:${radius},${lat},${lon});
        );
        out center;
      `;
      
      const overpassResponse = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      const overpassData = await overpassResponse.json();
      
      if (!overpassData.elements || overpassData.elements.length === 0) {
        setMessage({ 
          type: 'warning', 
          text: `No fire stations found within ${searchLocation.radius}km of ${searchLocation.city}. Try increasing the radius or a different location.` 
        });
        setLoading(false);
        return;
      }

      // Step 3: Process discovered stations
      const discovered = overpassData.elements.map(element => {
        const stationLat = element.lat || element.center?.lat;
        const stationLon = element.lon || element.center?.lon;
        
        return {
          name: element.tags?.name || `Fire Station (${element.tags?.['addr:street'] || 'Unnamed'})`,
          address: [
            element.tags?.['addr:street'],
            element.tags?.['addr:housenumber'],
            element.tags?.['addr:city'],
            element.tags?.['addr:postcode']
          ].filter(Boolean).join(', ') || 'Address not available',
          latitude: stationLat,
          longitude: stationLon,
          phone: element.tags?.phone || element.tags?.['contact:phone'] || 'Not available',
          email: element.tags?.email || element.tags?.['contact:email'] || '',
          operator: element.tags?.operator || '',
          osmId: element.id
        };
      }).filter(station => station.latitude && station.longitude);

      setDiscoveredStations(discovered);
      setShowDiscovery(true);
      setMessage({ 
        type: 'success', 
        text: `Found ${discovered.length} fire station(s)! Review and import them below.` 
      });
      
    } catch (err) {
      console.error('Auto-discovery error:', err);
      setMessage({ 
        type: 'error', 
        text: 'Failed to discover fire stations. Please try again or add manually.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const importStation = async (station) => {
    setLoading(true);
    try {
      const data = {
        name: station.name,
        address: station.address,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        phone: station.phone,
        email: station.email,
        personnel: 0,
        vehicles: []
      };

      await fireStationsAPI.create(data);
      
      setMessage({ type: 'success', text: `${station.name} imported successfully!` });
      
      // Remove from discovered list
      setDiscoveredStations(prev => prev.filter(s => s.osmId !== station.osmId));
      
      // Refresh stations list
      fetchStations();
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Failed to import ${station.name}: ${error.response?.data?.error || 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const importAllStations = async () => {
    if (!window.confirm(`Import all ${discoveredStations.length} fire stations?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const station of discoveredStations) {
      try {
        const data = {
          name: station.name,
          address: station.address,
          latitude: parseFloat(station.latitude),
          longitude: parseFloat(station.longitude),
          phone: station.phone,
          email: station.email,
          personnel: 0,
          vehicles: []
        };

        await fireStationsAPI.create(data);
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${station.name}:`, error);
        failCount++;
      }
    }

    setMessage({ 
      type: 'success', 
      text: `Imported ${successCount} station(s)${failCount > 0 ? `, ${failCount} failed` : ''}!` 
    });
    
    setDiscoveredStations([]);
    setShowDiscovery(false);
    fetchStations();
    setLoading(false);
  };

  if (loading && stations.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading fire stations...</p>
      </div>
    );
  }

  return (
    <div className="fire-stations-page">
      <div className="stations-header">
        <div>
          <h1 className="stations-title">🚒 Fire Stations Management</h1>
          <p className="stations-subtitle">Manage fire station locations for route optimization</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '➕ Add Fire Station'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Auto-Discovery Section */}
      <div className="auto-discovery-card">
        <div className="discovery-header">
          <div>
            <h2 className="discovery-title">🔍 Auto-Discover Fire Stations</h2>
            <p className="discovery-subtitle">
              Automatically find fire stations in your area from OpenStreetMap
            </p>
          </div>
        </div>
        
        <div className="discovery-form">
          <div className="discovery-inputs">
            <div className="form-group">
              <label htmlFor="searchCity">City or Location</label>
              <input
                type="text"
                id="searchCity"
                className="form-control"
                placeholder="e.g., New York, London, Tokyo"
                value={searchLocation.city}
                onChange={(e) => setSearchLocation({ ...searchLocation, city: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && autoDiscoverStations()}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="searchRadius">Search Radius (km)</label>
              <select
                id="searchRadius"
                className="form-control"
                value={searchLocation.radius}
                onChange={(e) => setSearchLocation({ ...searchLocation, radius: e.target.value })}
              >
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="200">200 km</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-discover"
              onClick={autoDiscoverStations}
              disabled={loading || !searchLocation.city}
            >
              {loading ? '🔄 Searching...' : '🔍 Discover Stations'}
            </button>
          </div>
        </div>

        {/* Discovered Stations List */}
        {showDiscovery && discoveredStations.length > 0 && (
          <div className="discovered-list">
            <div className="discovered-header">
              <h3>Found {discoveredStations.length} Fire Station(s)</h3>
              <button
                className="btn btn-success"
                onClick={importAllStations}
                disabled={loading}
              >
                ✅ Import All
              </button>
            </div>

            <div className="discovered-stations">
              {discoveredStations.map((station, idx) => (
                <div key={station.osmId || idx} className="discovered-station-card">
                  <div className="discovered-station-info">
                    <h4>{station.name}</h4>
                    <p className="discovered-address">📍 {station.address}</p>
                    <p className="discovered-coords">
                      📐 {parseFloat(station.latitude).toFixed(4)}, {parseFloat(station.longitude).toFixed(4)}
                    </p>
                    {station.phone !== 'Not available' && (
                      <p className="discovered-phone">📞 {station.phone}</p>
                    )}
                    {station.operator && (
                      <p className="discovered-operator">🏢 {station.operator}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => importStation(station)}
                    disabled={loading}
                  >
                    ➕ Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="station-form-card">
          <h2 className="form-title">Add New Fire Station</h2>
          <form onSubmit={handleSubmit} className="station-form">
            <div className="form-group">
              <label htmlFor="name">Station Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="e.g., Central Fire Station"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <div className="address-search-group">
                <input
                  type="text"
                  id="address"
                  name="address"
                  className="form-control"
                  placeholder="Full address of fire station"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={searchAddress}
                  disabled={loading}
                >
                  🔍 Search
                </button>
              </div>
              <small className="form-hint">
                Click "Search" to automatically fill coordinates from address
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="latitude">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  name="latitude"
                  className="form-control"
                  placeholder="e.g., 40.7128"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  name="longitude"
                  className="form-control"
                  placeholder="e.g., -74.0060"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder="+1-555-0100"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="station@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personnel">Personnel Count</label>
                <input
                  type="number"
                  id="personnel"
                  name="personnel"
                  className="form-control"
                  placeholder="e.g., 25"
                  value={formData.personnel}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicles">Vehicles (comma-separated)</label>
                <input
                  type="text"
                  id="vehicles"
                  name="vehicles"
                  className="form-control"
                  placeholder="Engine 1, Ladder 2, Ambulance 1"
                  value={formData.vehicles}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : '✅ Add Station'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stations-grid">
        {stations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚒</div>
            <h3>No Fire Stations Yet</h3>
            <p>Add your first fire station to enable route optimization for incidents</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              ➕ Add Fire Station
            </button>
          </div>
        ) : (
          stations.map(station => (
            <div key={station._id} className="station-card">
              <div className="station-card-header">
                <h3>{station.name}</h3>
                <button
                  className="btn-icon-delete"
                  onClick={() => handleDelete(station._id)}
                  title="Deactivate station"
                >
                  🗑️
                </button>
              </div>
              <div className="station-info">
                <p className="station-address">📍 {station.address}</p>
                <p className="station-phone">📞 {station.phone}</p>
                {station.email && <p className="station-email">✉️ {station.email}</p>}
                <div className="station-meta">
                  <span>👥 {station.personnel || 0} Personnel</span>
                  {station.vehicles && station.vehicles.length > 0 && (
                    <span>🚒 {station.vehicles.length} Vehicles</span>
                  )}
                </div>
                {station.vehicles && station.vehicles.length > 0 && (
                  <div className="vehicles-list">
                    <strong>Vehicles:</strong>
                    <ul>
                      {station.vehicles.map((vehicle, idx) => (
                        <li key={idx}>{vehicle}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FireStations;