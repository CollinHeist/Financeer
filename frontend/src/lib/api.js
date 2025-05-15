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
 * Fetches all Transactions from the API
 * @param {number} page The page number to fetch
 * @param {number} size The number of items per page
 * @returns {Promise<Object>} Paginated transaction data
 * @throws {Error} If the API request fails
 */
export const getAllTransactions = async (page = 1, size = 25) => {
  try {
    const { data } = await api.get(`/transaction/all?page=${page}&size=${size}`);
    return data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Fetches a transaction by ID
 * @param {number} transactionId The ID of the transaction to fetch
 * @returns {Promise<Object>} The transaction data
 * @throws {Error} If the API request fails
 */
export const getTransactionById = async (transactionId) => {
  try {
    const { data } = await api.get(`/transaction/${transactionId}`);
    return data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transaction:', error);
    throw error;
  }
}


/**
 * Deletes a transaction
 * @param {number} transactionId The ID of the transaction to delete
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails
 */
export const deleteTransaction = async (transactionId) => {
  try {
    await api.delete(`/transaction/${transactionId}`);
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting transaction:', error);
    throw error;
  }
}

/**
 * Updates a transaction
 * @param {number} transactionId The ID of the transaction to update
 * @param {Object} transactionData The updated transaction data
 * @returns {Promise<Object>} The updated transaction data
 * @throws {Error} If the API request fails
 */
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await api.put(`/transaction/${transactionId}`, transactionData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error updating transaction:', error);
    throw error;
  }
}

/**
 * Creates a new transaction
 * @param {Object} transactionData The transaction data to create
 * @returns {Promise<Object>} The created transaction data
 * @throws {Error} If the API request fails
 */
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transaction/new', transactionData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating transaction:', error);
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
 * Fetches all expenses from the API
 * @returns {Promise<Array>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const getAllExpenses = async () => {
  try {
    const response = await api.get('/expense/all');
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
    throw error;
  }
}


/**
 * Creates a new expense record
 * @param {Object} expenseData The expense data to create
 * @returns {Promise<Object>} The created expense data
 * @throws {Error} If the API request fails
 */
export const createExpense = async (expenseData) => {
  try {
    const response = await api.post('/expense/new', expenseData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating expense:', error);
    throw error;
  }
}

/**
 * Updates an expense record
 * @param {number} expenseId The ID of the expense to update
 * @param {Object} expenseData The updated expense data
 * @returns {Promise<Object>} The updated expense data
 * @throws {Error} If the API request fails
 */
export const updateExpense = async (expenseId, expenseData) => {
  try {
    const response = await api.put(`/expense/${expenseId}`, expenseData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error updating expense:', error);
    throw error;
  }
}

/**
 * Partially updates an expense record
 * @param {number} expenseId The ID of the expense to patch
 * @param {Object} expenseData The partial expense data to update
 * @returns {Promise<Object>} The updated expense data
 * @throws {Error} If the API request fails
 */
export const patchExpense = async (expenseId, expenseData) => {
  try {
    const response = await api.patch(`/expense/${expenseId}`, expenseData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error patching expense:', error);
    throw error;
  }
}

/**
 * Deletes an expense record
 * @param {number} expenseId The ID of the expense to delete
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails
 */
export const deleteExpense = async (expenseId) => {
  try {
    await api.delete(`/expense/${expenseId}`);
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting expense:', error);
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

/**
 * Fetches a single expense by ID
 * @param {number} expenseId The ID of the expense to fetch
 * @returns {Promise<Object>} The expense data
 * @throws {Error} If the API request fails
 */
export const getExpenseById = async (expenseId) => {
  try {
    const response = await api.get(`/expense/${expenseId}`);
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
    const response = await api.post('/balance/new', balanceData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating balance:', error);
    throw error;
  }
}
