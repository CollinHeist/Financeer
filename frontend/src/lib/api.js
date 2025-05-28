import axios from 'axios';
import * as api_types from './api_types';

const API_URL = 'http://localhost:8000/api/v1/';

export const api = axios.create({
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

/**
 * Fetches all bank accounts from the API
 * @returns {Promise<Array>} Array of bank account data
 * @throws {Error} If the API request fails
 */
export const getBankAccounts = async () => {
  try {
    const { data } = await api.get('/account/banks');
    return data;
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch bank accounts');
  }
};

/**
 * Fetches all to and from expenses for an account from the API
 * @param {number} accountId The ID of the account to fetch expenses for
 * @returns {Promise<Array>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const getAllAccountExpenses = async (accountId) => {
  try {
    const response = await api.get(`/expenses/account/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Creates a new balance record
 * @param {Object} balanceData The balance data to create
 * @returns {Promise<Object>} The created balance data
 * @throws {Error} If the API request fails
 */
export const createBalance = async (balanceData) => {
  try {
    const response = await api.post('/balances/balance/new', balanceData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating balance:', error);
    throw error;
  }
}

/**
 * Fetches all transactions from an expense
 * @param {number} expenseId The ID of the expense to fetch transactions for
 * @returns {Promise<ReturnTransactionSchemaNoAccount[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getExpenseTransactions = async (expenseId) => {
  try {
    const response = await api.get(`/transaction/expense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transactions from expense:', error);
    throw error;
  }
}

/**
 * Fetches the expense breakdown for an account
 * @param {number} accountId The ID of the account to fetch the expense breakdown for
 * @param {string} startDate The start date in YYYY-MM-DD format
 * @param {string} endDate The end date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of expense breakdown data
 * @throws {Error} If the API request fails
 */
export const getAccountBillBreakdown = async (accountId, startDate, endDate) => {
  try {
    const response = await api.get(`/transactions/account/${accountId}/bill-breakdown`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching bill breakdown:', error);
    throw error;
  }
}

/**
 * Fetches daily balances for an account
 * @param {number} accountId The ID of the account to fetch the daily balances for
 * @param {string} startDate The start date in YYYY-MM-DD format
 * @param {string} endDate The end date in YYYY-MM-DD format
 * @returns {Promise<api_types.ReturnDailyBalanceSchema[]>} Array of daily balance data
 * @throws {Error} If the API request fails
 */
export const getDailyBalances = async (accountId, startDate, endDate) => {
  try {
    const response = await api.get(`/balances/account/${accountId}/daily`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching daily balances:', error);
    throw error;
  }
}
