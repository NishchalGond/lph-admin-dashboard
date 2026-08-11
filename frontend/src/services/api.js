import axios from 'axios';

// Use env variable in production, fallback to local dev server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 (expired/invalid token) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getDashboardSummary = () => api.get('/dashboard/summary');
export const globalSearch = (q, page = 1) => api.get(`/search/global?q=${encodeURIComponent(q)}&page=${page}`);
export const semanticSearch = (q, page = 1, page_size = 20) => api.get('/search/semantic', { params: { q, page, page_size } });

export const getFiles = (params) => api.get('/files', { params });
export const getFileDetails = (fileId) => api.get(`/files/${fileId}`);


export const getRecords = (params) => api.get('/records', { params });
export const getRecordDetails = (recordId) => api.get(`/records/${recordId}`);
export const getRecordSuggestions = (q, limit = 8) => api.get('/records/suggestions', { params: { q, limit } });
export const getFilterOptions = () => api.get('/records/filter-options');

export const getBatches = (params) => api.get('/batches', { params });
export const getBatchDetails = (batchId) => api.get(`/batches/${batchId}`);

export const getDuplicates = (params) => api.get('/duplicates', { params });
export const getMonitorState = () => api.get('/monitor/state');
export const getLogs = (params) => api.get('/logs', { params });
export const getLogStats = () => api.get('/logs/stats');
export const createLogEntry = (data) => api.post('/logs', data);
export const getAnalytics = () => api.get('/analytics');

export const loginUser = (username, password) => api.post('/auth/login', { username, password });
export const loginByPassword = (password) => api.post('/auth/login-password', { password });

// Workflow Live Status (polls n8n progress)
export const getWorkflowLive = () => api.get('/workflow/live');

export const getExportUrl = (params) => {
  const token = localStorage.getItem('token');
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${API_BASE_URL}/export/records?${query}`;
};

export default api;
