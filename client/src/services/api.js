import axios from 'axios';

// Determine API Base URL: fallback to current origin or render url
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'
    : 'https://footwear-api-sf29.onrender.com/api');

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('as_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth
      if (localStorage.getItem('as_auth_token')) {
        localStorage.removeItem('as_auth_token');
        localStorage.removeItem('as_auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const inventoryApi = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  adjustStock: (id, data) => api.patch(`/inventory/${id}/stock`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

export const invoiceApi = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  getNextNumber: () => api.get('/invoices/next-number'),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.put(`/invoices/${id}`, { status }),
};

export { api, API_BASE };

export default {
  auth: authApi,
  inventory: inventoryApi,
  invoice: invoiceApi,
};