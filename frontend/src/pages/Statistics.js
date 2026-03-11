import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { incidentsAPI } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Statistics.css';

const Statistics = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, incidentsRes] = await Promise.all([
        incidentsAPI.getStats(),
        incidentsAPI.getAll()
      ]);
      setStats(statsRes.data);
      setIncidents(incidentsRes.data.incidents);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate incidents over time
  const getIncidentsOverTime = () => {
    const days = parseInt(timeRange);
    const now = new Date();
    const dataMap = {};

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[dateStr] = 0;
    }

    // Count incidents per day
    incidents.forEach(incident => {
      const incidentDate = new Date(incident.createdAt);
      const daysAgo = Math.floor((now - incidentDate) / (1000 * 60 * 60 * 24));
      
      if (daysAgo < days) {
        const dateStr = incidentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr]++;
        }
      }
    });

    return Object.keys(dataMap).map(date => ({
      date,
      incidents: dataMap[date]
    }));
  };

  // Get incidents by type
  const getIncidentsByType = () => {
    const typeCount = {};
    incidents.forEach(incident => {
      typeCount[incident.fireType] = (typeCount[incident.fireType] || 0) + 1;
    });

    return Object.keys(typeCount).map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: typeCount[type]
    }));
  };

  // Get incidents by priority
  const getIncidentsByPriority = () => {
    const priorityCount = { low: 0, medium: 0, high: 0, critical: 0 };
    incidents.forEach(incident => {
      priorityCount[incident.priority]++;
    });

    return Object.keys(priorityCount).map(priority => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: priorityCount[priority]
    }));
  };

  // Get incidents by status
  const getIncidentsByStatus = () => {
    const statusCount = {};
    incidents.forEach(incident => {
      statusCount[incident.status] = (statusCount[incident.status] || 0) + 1;
    });

    return Object.keys(statusCount).map(status => ({
      name: status.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count: statusCount[status]
    }));
  };

  // Calculate average response time
  const getAverageResponseTime = () => {
    const responseTimes = incidents
      .filter(i => i.statusHistory && i.statusHistory.length > 1)
      .map(incident => {
        const reported = new Date(incident.createdAt);
        const responded = incident.statusHistory.find(h => h.status === 'on-scene');
        if (responded) {
          const onScene = new Date(responded.timestamp);
          return (onScene - reported) / (1000 * 60); // minutes
        }
        return null;
      })
      .filter(time => time !== null);

    if (responseTimes.length === 0) return 0;
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return Math.round(avg);
  };

  // Get incidents by hour of day
  const getIncidentsByHour = () => {
    const hourCount = Array(24).fill(0);
    incidents.forEach(incident => {
      const hour = new Date(incident.createdAt).getHours();
      hourCount[hour]++;
    });

    return hourCount.map((count, hour) => ({
      hour: `${hour}:00`,
      incidents: count
    }));
  };

  // Chart colors
  const COLORS = ['#d32f2f', '#f57c00', '#ffc107', '#4caf50', '#2196f3', '#9c27b0', '#e91e63', '#00bcd4'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  const incidentsOverTime = getIncidentsOverTime();
  const incidentsByType = getIncidentsByType();
  const incidentsByPriority = getIncidentsByPriority();
  const incidentsByStatus = getIncidentsByStatus();
  const incidentsByHour = getIncidentsByHour();
  const avgResponseTime = getAverageResponseTime();

  return (
    <div className="statistics-page">
      <div className="stats-header">
        <div>
          <h1 className="stats-title">📊 Advanced Statistics Dashboard</h1>
          <p className="stats-subtitle">Comprehensive analytics and insights</p>
        </div>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="form-control">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card total">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.total || 0}</div>
            <div className="metric-label">Total Incidents</div>
          </div>
        </div>

        <div className="metric-card active">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.active || 0}</div>
            <div className="metric-label">Active Incidents</div>
          </div>
        </div>

        <div className="metric-card resolved">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">{stats?.resolved || 0}</div>
            <div className="metric-label">Resolved</div>
          </div>
        </div>

        <div className="metric-card response-time">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{avgResponseTime} min</div>
            <div className="metric-label">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Incidents Over Time */}
        <div className="chart-card large">
          <h3 className="chart-title">📈 Incidents Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incidentsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                labelStyle={{ color: '#e0e0e0' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#d32f2f" 
                strokeWidth={3}
                dot={{ fill: '#d32f2f', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Type */}
        <div className="chart-card">
          <h3 className="chart-title">🔥 Incidents by Fire Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {incidentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Priority */}
        <div className="chart-card">
          <h3 className="chart-title">⚠️ Incidents by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incidentsByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#f57c00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Status */}
        <div className="chart-card">
          <h3 className="chart-title">📋 Incidents by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incidentsByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis type="number" stroke="#999" />
              <YAxis dataKey="name" type="category" stroke="#999" width={100} />
              <Tooltip 
                contentStyle={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Hour */}
        <div className="chart-card large">
          <h3 className="chart-title">🕐 Incidents by Time of Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incidentsByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="hour" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ background: '#151515', border: '1px solid #2a2a2a', borderRadius: '8px' }}
              />
              <Bar dataKey="incidents" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats Table */}
      <div className="stats-table-card">
        <h3 className="chart-title">📑 Detailed Breakdown</h3>
        <div className="stats-table">
          <div className="stats-row">
            <span className="stats-label">Total Reports:</span>
            <span className="stats-value">{stats?.total || 0}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Active Fires:</span>
            <span className="stats-value highlight-red">{stats?.active || 0}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Resolved Fires:</span>
            <span className="stats-value highlight-green">{stats?.resolved || 0}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Average Response Time:</span>
            <span className="stats-value">{avgResponseTime} minutes</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Resolution Rate:</span>
            <span className="stats-value">
              {stats?.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Most Common Fire Type:</span>
            <span className="stats-value">
              {incidentsByType.length > 0 
                ? incidentsByType.reduce((a, b) => a.value > b.value ? a : b).name 
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;