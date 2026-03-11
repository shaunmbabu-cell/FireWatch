import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import { requestNotificationPermission } from '../services/pushNotifications';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        socketService.connect(parsedUser.role);
        
        // Verify token is still valid
        authAPI.getProfile()
          .then(response => {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          })
          .catch(() => {
            logout();
          });
      } catch (error) {
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Connect to socket
      socketService.connect(userData.role);
      
      // Request notification permission for responders/admins
      if (userData.role === 'admin' || userData.role === 'responder') {
        requestNotificationPermission();
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Connect to socket
      socketService.connect(newUser.role);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    socketService.disconnect();
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isResponder: user?.role === 'admin' || user?.role === 'responder'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};