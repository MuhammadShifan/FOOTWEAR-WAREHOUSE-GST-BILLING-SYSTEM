import axios from 'axios';

const API_BASE = '/api';

export const inventoryApi = {
  getAll: (params) => axios.get(`${API_BASE}/inventory`, { params }),
  getById: (id) => axios.get(`${API_BASE}/inventory/${id}`),
  create: (data) => axios.post(`${API_BASE}/inventory`, data),
  update: (id, data) => axios.put(`${API_BASE}/inventory/${id}`, data),
  adjustStock: (id, data) => axios.patch(`${API_BASE}/inventory/${id}/stock`, data),
  delete: (id) => axios.delete(`${API_BASE}/inventory/${id}`),
};

export const invoiceApi = {
  getAll: (params) => axios.get(`${API_BASE}/invoices`, { params }),
  getById: (id) => axios.get(`${API_BASE}/invoices/${id}`),
  getNextNumber: () => axios.get(`${API_BASE}/invoices/next-number`),
  create: (data) => axios.post(`${API_BASE}/invoices`, data),
  updateStatus: (id, status) => axios.put(`${API_BASE}/invoices/${id}`, { status }),
};

export default {
  inventory: inventoryApi,
  invoice: invoiceApi,
};
