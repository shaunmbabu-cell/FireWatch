import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout, isAuthenticated, isResponder, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Auto-hide on scroll functionality
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide navbar
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${isVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🔥</span>
          <span className="brand-text">FireWatch</span>
        </Link>

        <div className="nav-links">
          {!isAuthenticated ? (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/report" className="nav-link">Report Fire</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link btn-nav-primary">Sign Up</Link>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">Home</Link>
              {isResponder && (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <Link to="/manual-entry" className="nav-link">Log Incident</Link>
                </>
              )}
              {isAdmin && (
                <>
                  <Link to="/statistics" className="nav-link">Statistics</Link>
                  <Link to="/fire-stations" className="nav-link">Fire Stations</Link>
                </>
              )}
              {user && !isAdmin && (
                  <Link to="/report" className="nav-link">Report Fire</Link>
              )}
              <div className="nav-user">
                <span className="user-name">👤 {user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="nav-link btn-nav-secondary">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;