import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportFire from './pages/ReportFire';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import ManualEntry from './pages/ManualEntry';
import FireStations from './pages/FireStations';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/report" element={<ReportFire />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireResponder>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual-entry"
              element={
                <ProtectedRoute requireResponder>
                  <ManualEntry />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute requireAdmin>
                  <Statistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fire-stations"
              element={
                <ProtectedRoute requireAdmin>
                  <FireStations />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;