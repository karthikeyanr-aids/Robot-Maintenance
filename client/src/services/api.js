import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from sessionStorage
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('robocare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      if (window.location.pathname !== '/login') {
        sessionStorage.removeItem('robocare_token');
        sessionStorage.removeItem('robocare_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getMe: () => API.get('/auth/me'),
  updateProfile: (profileData) => API.put('/auth/profile', profileData),
};

export const robotsAPI = {
  getAll: (params) => API.get('/robots', { params }),
  getById: (id) => API.get(`/robots/${id}`),
  create: (data) => API.post('/robots', data),
  update: (id, data) => API.put(`/robots/${id}`, data),
  delete: (id) => API.delete(`/robots/${id}`),
};

export const componentsAPI = {
  getAll: (params) => API.get('/components', { params }),
  getById: (id) => API.get(`/components/${id}`),
  create: (data) => API.post('/components', data),
  update: (id, data) => API.put(`/components/${id}`, data),
  delete: (id) => API.delete(`/components/${id}`),
};

export const errorsAPI = {
  getAll: (params) => API.get('/errors', { params }),
  create: (data) => API.post('/errors', data),
  update: (id, data) => API.put(`/errors/${id}`, data),
  delete: (id) => API.delete(`/errors/${id}`),
};

export const maintenanceAPI = {
  getAll: (params) => API.get('/maintenance', { params }),
  getById: (id) => API.get(`/maintenance/${id}`),
  create: (data) => API.post('/maintenance', data),
  update: (id, data) => API.put(`/maintenance/${id}`, data),
  delete: (id) => API.delete(`/maintenance/${id}`),
};

export const predictionsAPI = {
  getAll: (params) => API.get('/predictions', { params }),
  getByRobotId: (robotId) => API.get(`/predictions/${robotId}`),
  analyze: (robotId, data = {}) => API.post(`/predictions/analyze/${robotId}`, data),
};

export const notificationsAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

export const analyticsAPI = {
  getDashboard: () => API.get('/analytics/dashboard'),
  getTrends: () => API.get('/analytics/trends'),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  getTechnicians: () => API.get('/users/technicians'),
  create: (data) => API.post('/users', data),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
