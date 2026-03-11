import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ManualEntry.css';

const ManualEntry = () => {
  const { user, isResponder } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    fireType: 'residential',
    fireSize: 'medium',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    reportMethod: 'phone' // phone, walk-in, emergency-call
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');

  if (!isResponder) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  // Search for address and get coordinates
  const handleAddressSearch = async () => {
    if (!searchAddress) {
      setError('Please enter an address to search');
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
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
        setError('');
      } else {
        setError('Address not found. Please enter coordinates manually.');
      }
    } catch (err) {
      setError('Failed to search address. Please enter coordinates manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.latitude || !formData.longitude) {
      setError('Location coordinates are required');
      setLoading(false);
      return;
    }

    if (!formData.address) {
      setError('Address is required');
      setLoading(false);
      return;
    }

    try {
      // Prepare form data
      const submitData = new FormData();
      
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('address', formData.address);
      submitData.append('description', formData.description || `Fire reported via ${formData.reportMethod} by ${user.name}`);
      submitData.append('fireType', formData.fireType);
      submitData.append('fireSize', formData.fireSize);
      submitData.append('isAnonymous', 'false');
      submitData.append('contactName', formData.contactName || 'Reported by phone');
      submitData.append('contactPhone', formData.contactPhone || 'N/A');
      submitData.append('contactEmail', formData.contactEmail || '');

      await incidentsAPI.report(submitData);

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="manual-entry-page">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h1>Incident Logged Successfully!</h1>
          <p>The fire incident has been added to the system and all responders have been notified.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-entry-page">
      <div className="manual-entry-container">
        <div className="entry-header">
          <h1 className="entry-title">📝 Manual Incident Entry</h1>
          <p className="entry-subtitle">
            Log fire incidents reported by phone, walk-in, or emergency calls
          </p>
          <div className="logged-by">
            Logged by: <strong>{user.name}</strong> ({user.role})
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="entry-form">
          {/* Report Method */}
          <div className="form-section">
            <h2 className="section-title">📞 Report Method</h2>
            
            <div className="form-group">
              <label htmlFor="reportMethod">How was this fire reported?</label>
              <select
                id="reportMethod"
                name="reportMethod"
                className="form-control"
                value={formData.reportMethod}
                onChange={handleChange}
                required
              >
                <option value="phone">Phone Call</option>
                <option value="walk-in">Walk-in Report</option>
                <option value="emergency-call">Emergency Call (911/999)</option>
                <option value="radio">Radio Dispatch</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Location Section */}
          <div className="form-section">
            <h2 className="section-title">📍 Location Information</h2>
            
            <div className="address-search">
              <div className="search-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for address (e.g., '123 Main St, New York')"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddressSearch}
                  disabled={loading}
                >
                  🔍 Search
                </button>
              </div>
              <small className="form-hint">
                Search for an address to auto-fill coordinates, or enter them manually below
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

            <div className="form-group">
              <label htmlFor="address">Full Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                placeholder="Full address of the fire location"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Fire Details Section */}
          <div className="form-section">
            <h2 className="section-title">🔥 Fire Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fireType">Fire Type *</label>
                <select
                  id="fireType"
                  name="fireType"
                  className="form-control"
                  value={formData.fireType}
                  onChange={handleChange}
                  required
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="forest">Forest/Wildfire</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="electrical">Electrical</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fireSize">Fire Size *</label>
                <select
                  id="fireSize"
                  name="fireSize"
                  className="form-control"
                  value={formData.fireSize}
                  onChange={handleChange}
                  required
                >
                  <option value="small">Small (Contained, manageable)</option>
                  <option value="medium">Medium (Growing, needs attention)</option>
                  <option value="large">Large (Spreading rapidly)</option>
                  <option value="massive">Massive (Out of control)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description / Additional Notes</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                placeholder="Details provided by caller: flames, smoke, people in danger, etc."
                value={formData.description}
                onChange={handleChange}
                rows="5"
              ></textarea>
            </div>
          </div>

          {/* Caller Information Section */}
          <div className="form-section">
            <h2 className="section-title">📞 Caller/Reporter Information</h2>
            <p className="section-description">Contact information of the person who reported this incident</p>
            
            <div className="form-group">
              <label htmlFor="contactName">Caller Name</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                className="form-control"
                placeholder="Name of person who called"
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPhone">Caller Phone Number</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  className="form-control"
                  placeholder="Phone number"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail">Caller Email (if provided)</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  className="form-control"
                  placeholder="Email (optional)"
                  value={formData.contactEmail}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '🔄 Logging Incident...' : '✅ Log Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;