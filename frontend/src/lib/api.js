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
    throw new Error(error.response?.data?.detail || 'Failed to fetch account');
  }
};

/**
 * Fetches upcoming expenses for an account from the API
 * @param {number} accountID The ID of the account to fetch expenses for
 * @param {number} days Number of days to look ahead for expenses
 * @returns {Promise<Array>} Array of upcoming expense data
 * @throws {Error} If the API request fails
 */
export const getUpcomingAccountTransactions = async (accountID, days = 14) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + days);
    
    const { data } = await api.get(`/transaction/upcoming/account/${accountID}`, {
      params: {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
    return data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transactions:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch transactions');
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
    const response = await api.get(`/expenses/account/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Fetches all incomes from the API
 * @param {string} [date] Optional date to filter incomes by
 * @returns {Promise<Array>} Array of income data
 * @throws {Error} If the API request fails
 */
export const getAllIncomes = async (date = null) => {
  try {
    const response = await api.get('/income/all', {
      params: {
        on: date !== null ? new Date(date).toISOString().split('T')[0] : null
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching incomes:', error);
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
    console.error(error.response?.data?.detail || 'Error updating income:', error);
    throw error;
  }
}

/**
 * Partially updates an income record
 * @param {number} incomeId The ID of the income to patch
 * @param {Object} incomeData The partial income data to update
 * @returns {Promise<Object>} The updated income data
 * @throws {Error} If the API request fails
 */
export const patchIncome = async (incomeId, incomeData) => {
  try {
    const response = await api.patch(`/income/${incomeId}`, incomeData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error patching income:', error);
    throw error;
  }
}

/**
 * Deletes an income record
 * @param {number} incomeId The ID of the income to delete
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails
 */
export const deleteIncome = async (incomeId) => {
  try {
    await api.delete(`/income/${incomeId}`);
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting income:', error);
    throw error;
  }
}

/**
 * Creates a new account
 * @param {Object} accountData The account data to create
 * @returns {Promise<Object>} The created account data
 * @throws {Error} If the API request fails
 */
export const createAccount = async (accountData) => {
  try {
    const response = await api.post('/account', accountData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating account:', error);
    throw error;
  }
}

/**
 * Creates a new income record
 * @param {Object} incomeData The income data to create
 * @returns {Promise<Object>} The created income data
 * @throws {Error} If the API request fails
 */
export const createIncome = async (incomeData) => {
  try {
    const response = await api.post('/income/new', incomeData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating income:', error);
    throw error;
  }
}

/**
 * Fetches a single expense by ID
 * @param {number} expenseId The ID of the expense to fetch
 * @returns {Promise<Object>} The expense data
 * @throws {Error} If the API request fails
 */
export const getExpenseById = async (expenseId) => {
  try {
    const response = await api.get(`/expenses/expense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expense:', error);
    throw error;
  }
}

/**
 * Fetches a single income by ID
 * @param {number} incomeId The ID of the income to fetch
 * @returns {Promise<Object>} The income data
 * @throws {Error} If the API request fails
 */
export const getIncomeById = async (incomeId) => {
  try {
    const response = await api.get(`/income/${incomeId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching income:', error);
    throw error;
  }
}

/**
 * Fetches the summary for an account
 * @param {number} accountId The ID of the account to fetch the summary for
 * @returns {Promise<Object>} The account summary data
 * @throws {Error} If the API request fails
 */
export const getAccountSummary = async (accountId) => {
  try {
    const response = await api.get(`/account/${accountId}/summary`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching account summary:', error);
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
 * Fetches all transactions associated with an income
 * @param {number} incomeId The ID of the income to fetch transactions for
 * @returns {Promise<Array>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getIncomeTransactions = async (incomeId) => {
  try {
    const response = await api.get(`/transactions/income/${incomeId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching income transactions:', error);
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
