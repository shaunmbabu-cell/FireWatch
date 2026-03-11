import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout')
};

// Incidents API
export const incidentsAPI = {
  report: (formData) => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return api.post('/incidents/report', formData, config);
  },
  getAll: (params) => api.get('/incidents', { params }),
  getById: (id) => api.get(`/incidents/${id}`),
  updateStatus: (id, data) => api.put(`/incidents/${id}/status`, data),
  assignResponders: (id, responderIds) => api.put(`/incidents/${id}/assign`, { responderIds }),
  updateResources: (id, resources) => api.put(`/incidents/${id}/resources`, resources),
  getNearby: (longitude, latitude, radius) => api.get(`/incidents/nearby/${longitude}/${latitude}`, { params: { radius } }),
  getStats: () => api.get('/incidents/stats/overview')
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  deactivate: (id) => api.put(`/users/${id}/deactivate`),
  activate: (id) => api.put(`/users/${id}/activate`),
  getResponders: () => api.get('/users/responders/list')
};

// Fire Stations API
export const fireStationsAPI = {
  getAll: () => api.get('/fire-stations'),
  getNearest: (longitude, latitude) => api.get(`/fire-stations/nearest/${longitude}/${latitude}`),
  create: (data) => api.post('/fire-stations', data),
  update: (id, data) => api.put(`/fire-stations/${id}`, data),
  delete: (id) => api.delete(`/fire-stations/${id}`)
};

export default api;