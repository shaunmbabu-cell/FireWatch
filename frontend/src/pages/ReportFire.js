import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ReportFire.css';

const ReportFire = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    fireType: 'residential',
    fireSize: 'medium',
    isAnonymous: false,
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || ''
  });
  
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name,
        contactPhone: user.phone || '',
        contactEmail: user.email
      }));
    }
  }, [user]);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setFormData(prev => ({
              ...prev,
              address: data.display_name
            }));
          }
        } catch (err) {
          console.error('Error getting address:', err);
        }

        setGettingLocation(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter it manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed');
      return;
    }

    // Validate file sizes (50MB max per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each file must be less than 50MB');
      return;
    }

    setFiles([...files, ...selectedFiles].slice(0, 5)); // Max 5 files
    setError('');
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.latitude || !formData.longitude) {
      setError('Location is required. Please use "Get Current Location" or enter coordinates manually.');
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
      submitData.append('description', formData.description);
      submitData.append('fireType', formData.fireType);
      submitData.append('fireSize', formData.fireSize);
      submitData.append('isAnonymous', formData.isAnonymous);
      
      if (!formData.isAnonymous) {
        submitData.append('contactName', formData.contactName);
        submitData.append('contactPhone', formData.contactPhone);
        submitData.append('contactEmail', formData.contactEmail);
      }

      // Append files
      files.forEach(file => {
        submitData.append('media', file);
      });

      await incidentsAPI.report(submitData);

      setSuccess(true);
      
      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="report-page">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h1>Incident Reported Successfully!</h1>
          <p>Emergency responders have been notified and will respond immediately.</p>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-container">
        <div className="report-header">
          <h1 className="report-title">🚨 Report Fire Emergency</h1>
          <p className="report-subtitle">
            Provide as much information as possible to help responders assess and handle the situation
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form">
          {/* Location Section */}
          <div className="form-section">
            <h2 className="section-title">📍 Location Information</h2>
            
            <button
              type="button"
              className="btn btn-secondary btn-location"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? '📡 Getting location...' : '📍 Get Current Location'}
            </button>

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
              <label htmlFor="address">Address *</label>
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
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                className="form-control"
                placeholder="Describe what you see: flames, smoke, affected areas, any people in danger, etc."
                value={formData.description}
                onChange={handleChange}
                rows="5"
                required
              ></textarea>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="form-section">
            <h2 className="section-title">📸 Photos/Videos (Optional)</h2>
            <p className="section-description">Upload photos or videos to help responders assess the situation (Max 5 files, 50MB each)</p>
            
            <div className="file-upload">
              <input
                type="file"
                id="media"
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="file-input"
              />
              <label htmlFor="media" className="file-label">
                <span className="file-icon">📁</span>
                <span>Choose Files</span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">
                      {file.type.startsWith('image/') ? '🖼️' : '🎥'} {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="file-remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <h2 className="section-title">📞 Contact Information</h2>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                />
                <span>Report anonymously (responders won't be able to contact you for updates)</span>
              </label>
            </div>

            {!formData.isAnonymous && (
              <>
                <div className="form-group">
                  <label htmlFor="contactName">Your Name</label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    className="form-control"
                    placeholder="John Doe"
                    value={formData.contactName}
                    onChange={handleChange}
                    disabled={isAuthenticated}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="contactPhone">Phone Number</label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      disabled={isAuthenticated}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactEmail">Email</label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      className="form-control"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      disabled={isAuthenticated}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? '🔄 Submitting Report...' : '🚨 Submit Fire Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportFire;