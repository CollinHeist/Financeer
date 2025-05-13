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

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This allows sending cookies if needed
});

/**
 * Fetches all accounts from the API
 * @returns {Promise<Array>} Array of account data
 * @throws {Error} If the API request fails
 */
export const getAccounts = async () => {
  // Add an intentional delay for development/testing purposes
  try {
    const { data } = await api.get('/account/all');
    return data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

/**
 * Fetches account information from the API
 * @param {number} accountID The ID of the account to fetch
 * @returns {Promise<Object>} The account data
 * @throws {Error} If the API request fails
 */
export const getAccount = async (accountID) => {
  try {
    const { data } = await api.get(`/account/${accountID}`);
    return data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

/**
 * Fetches upcoming expenses for an account from the API
 * @param {number} accountID The ID of the account to fetch expenses for
 * @param {number} days Number of days to look ahead for expenses
 * @returns {Promise<Array>} Array of upcoming expense data
 * @throws {Error} If the API request fails
 */
export const getUpcomingAccountExpenses = async (accountID, days = 14) => {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const { data } = await api.get(`/expense/account/${accountID}/upcoming`, {
      params: {
        start: new Date().toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
    return data;
  } catch (error) {
    console.error('Error fetching upcoming expenses:', error);
    throw error;
  }
};

/**
 * Fetches all transactions from the API
 * @returns {Promise<Array>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getTransactions = async () => {
  try {
    const { data } = await api.get('/transaction/all');
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Fetches all to and from expenses for an account from the API
 * @param {number} accountId The ID of the account to fetch expenses for
 * @returns {Promise<Array>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const getAllAccountExpenses = async (accountId) => {
  try {
    const response = await api.get(`/expense/account/${accountId}/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Fetches all incomes from the API
 * @returns {Promise<Array>} Array of income data
 * @throws {Error} If the API request fails
 */
export const getAllIncomes = async () => {
  try {
    const response = await api.get('/income/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching incomes:', error);
    throw error;
  }
}

/**
 * Updates an income record
 * @param {number} incomeId The ID of the income to update
 * @param {Object} incomeData The updated income data
 * @returns {Promise<Object>} The updated income data
 * @throws {Error} If the API request fails
 */
export const updateIncome = async (incomeId, incomeData) => {
  try {
    const response = await api.put(`/income/${incomeId}`, incomeData);
    return response.data;
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
}

