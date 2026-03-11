import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated, isResponder } = useAuth();

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">EMERGENCY RESPONSE SYSTEM</div>
          <h1 className="hero-title">
            <span className="title-line">Report.</span>
            <span className="title-line">Respond.</span>
            <span className="title-line highlight">Save Lives.</span>
          </h1>
          <p className="hero-description">
            Real-time fire incident reporting and management system connecting citizens 
            with emergency responders. Every second counts when fighting fires.
          </p>
          <div className="hero-actions">
            <Link to="/report" className="btn btn-hero-primary">
              🚨 Report Fire Emergency
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-hero-secondary">
                Create Account
              </Link>
            )}
            {isResponder && (
              <Link to="/dashboard" className="btn btn-hero-secondary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-circle circle-1"></div>
          <div className="visual-circle circle-2"></div>
          <div className="visual-circle circle-3"></div>
          <div className="hero-icon">🔥</div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">Advanced tools for fire emergency management</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>GPS Location Tracking</h3>
            <p>Automatically capture and share your exact location for faster response times</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Media Upload</h3>
            <p>Attach photos and videos to help responders assess the situation</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Real-Time Alerts</h3>
            <p>Instant notifications to fire departments via SMS, email, and push alerts</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Live Map Visualization</h3>
            <p>Interactive map showing all active incidents and response units</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Resource Management</h3>
            <p>Track and assign vehicles, personnel, and equipment to incidents</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Anonymous reporting option with secure data handling and authentication</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-description">
            Join our network of emergency responders and concerned citizens working together 
            to save lives and protect communities.
          </p>
          <div className="cta-actions">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn btn-cta-primary">
                  Sign Up as Responder
                </Link>
                <Link to="/report" className="btn btn-cta-secondary">
                  Report an Incident
                </Link>
              </>
            ) : (
              <Link to="/report" className="btn btn-cta-primary">
                Report an Incident
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-icon">🚒</span>
            <span className="brand-text">FireWatch</span>
          </div>
          <p className="footer-text">
            Emergency Response System • Available 24/7 • Saving Lives Together
          </p>
          <p className="footer-copyright">
            © 2026 FireWatch. Built for emergency response professionals.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;