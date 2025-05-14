import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1/';

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
    throw new Error(error.response?.data?.detail || 'Failed to fetch accounts');
  }
};

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
    console.error('Error fetching expenses:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch expenses');
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
    console.error(error.response?.data?.detail || 'Error fetching transactions:', error);
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
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
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
