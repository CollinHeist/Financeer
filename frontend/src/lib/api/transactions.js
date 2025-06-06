import { api } from '@/lib/api';
import {
  NewSplitTransactionSchema,
  ReturnTransactionSchema,
  ReturnTransactionSchemaNoAccount,
  ReturnTransactionSchemaPage,
  UpdateTransactionSchema,
  SplitTransactionSchema,
} from './types';

/**
 * Fetches all Transactions from the API
 * @param {number} page The page number to fetch
 * @param {number} size The number of items per page
 * @param {?Date} date The date to filter transactions by
 * @param {?string} contains The string to filter transactions by
 * @param {boolean} unassigned_only Whether to only fetch unassigned transactions
 * @param {?Array<number>} account_ids Optional array of account IDs to filter by
 * @returns {Promise<ReturnTransactionSchemaPage>} Paginated transaction data
 * @throws {Error} If the API request fails
 */
export const getAllTransactions = async (
  page = 1,
  size = 25,
  date = null,
  contains = null,
  unassigned_only = false,
  account_ids = null,
) => {
  try {
    const params = new URLSearchParams({
      page,
      size,
      date: date === null ? null : date?.toISOString().split('T')[0],
      contains,
      unassigned_only,
    });

    // Add account_ids as repeated parameters if they exist
    if (account_ids && account_ids.length > 0) {
      account_ids.forEach(id => {
        params.append('account_ids', id);
      });
    }

    const { data } = await api.get(`/transactions/all`, { params });
    return data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Applies all filters to all transactions
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails
 */
export const applyTransactionFilters = async () => {
  try {
    const response = await api.post('/transactions/filters');
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || `Error applying Transaction filters:`, error);
    throw error;
  }
}

/**
 * Fetches a transaction by ID
 * @param {number} transactionId The ID of the transaction to fetch
 * @returns {Promise<ReturnTransactionSchema>} The transaction data
 * @throws {Error} If the API request fails
 */
export const getTransactionById = async (transactionId) => {
  try {
    const { data } = await api.get(`/transactions/transaction/${transactionId}`);
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
    await api.delete(`/transactions/transaction/${transactionId}`);
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting transaction:', error);
    throw error;
  }
}

/**
 * Updates a transaction
 * @param {number} transactionId The ID of the transaction to update
 * @param {NewTransactionSchema} transactionData The updated transaction data
 * @returns {Promise<ReturnTransactionSchema>} The updated transaction data
 * @throws {Error} If the API request fails
 */
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const response = await api.put(`/transactions/transaction/${transactionId}`, transactionData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error updating transaction:', error);
    throw error;
  }
}

/**
 * Partially updates a transaction
 * @param {number} transactionId The ID of the transaction to patch
 * @param {Object} transactionData The partial transaction data to update
 * @returns {Promise<PatchTransactionSchema>} The updated transaction data
 * @throws {Error} If the API request fails
 */
export const patchTransaction = async (transactionId, transactionData) => {
  try {
    const response = await api.patch(`/transactions/transaction/${transactionId}`, transactionData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error patching transaction:', error);
    throw error;
  }
}

/**
 * Creates a new transaction
 * @param {Object} transactionData The transaction data to create
 * @returns {Promise<NewTransactionSchema>} The created transaction data
 * @throws {Error} If the API request fails
 */
export const createTransaction = async (transactionData) => {
  try {
    const response = await api.post('/transactions/transaction/new', transactionData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating transaction:', error);
    throw error;
  }
}

/**
 * Fetches transactions from the API based on filters
 * @param {number} id The ID of the expense/income to fetch transactions for
 * @param {Array} filters The filters to apply
 * @param {"bill" | "expense" | "income" | "transfer"} type The type of item
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getTransactionsFromFilters = async (id, filters, type) => {
  try {
    const response = await api.put(`/transactions/filters?type=${type}&id=${id}`, filters);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || `Error fetching Transactions from ${type} filters:`, error);
    throw error;
  }
}

/**
 * Fetches transactions for an expense
 * @param {number} expenseId The ID of the expense to fetch transactions for
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getExpenseTransactions = async (expenseId) => {
  try {
    const response = await api.get(`/transactions/expense/${expenseId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || `Error fetching Expense transactions:`, error);
    throw error;
  }
}

/**
 * Splits a transaction into multiple transactions
 * @param {number} transactionId The ID of the transaction to split
 * @param {NewSplitTransactionSchema[]} splitData The data for the split transactions
 * @returns {Promise<ReturnTransactionSchema[]>} Array of split transaction data
 * @throws {Error} If the API request fails
 */
export const splitTransaction = async (transactionId, splitData) => {
  try {
    const response = await api.post(`/transactions/transaction/${transactionId}/split`, splitData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || `Error splitting transaction:`, error);
    throw error;
  }
}

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
    
    const { data } = await api.get(`/transactions/upcoming/account/${accountID}`, {
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
 * Fetches all transactions associated with an income
 * @param {number} incomeId The ID of the income to fetch transactions for
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
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
 * Syncs Transactions for an account
 * @param {number} accountId The ID of the account to sync transactions for
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const syncAccountTransactions = async (accountId) => {
  try {
    const response = await api.post(`/transactions/account/${accountId}/sync`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error syncing account transactions:', error);
    throw error;
  }
}

/**
 * Syncs all Transactions for all accounts
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const syncAllAccountTransactions = async () => {
  try {
    const response = await api.post(`/transactions/sync`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error syncing all account transactions:', error);
    throw error;
  }
}
