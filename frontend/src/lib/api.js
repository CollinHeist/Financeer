import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getAccounts = async () => {
  try {
    const response = await api.get('/api/v1/account/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch accounts');
  }
};

export const getAccount = async (account_id) => {
  try {
    const response = await api.get(`/api/v1/account/${account_id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch account');
  }
};

export const getUpcomingAccountExpenses = async (account_id, days=14) => {
  try {
    let url = `/api/v1/expense/account/${account_id}/upcoming`;
    const params = new URLSearchParams({start: new Date().toISOString().split('T')[0]});
    if (days) {
      params.append('end', new Date(new Date().setDate(new Date().getDate() + days)).toISOString().split('T')[0]);
    }
    const response = await api.get(`${url}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch expenses');
  }
};

export default api;
