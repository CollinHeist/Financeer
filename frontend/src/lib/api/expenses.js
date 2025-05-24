import { api } from '@/lib/api';

import { NewExpenseSchema, PatchExpenseSchema, ReturnExpenseSchema } from './types';


/**
 * Fetches all expenses from the API
 * @param {string} [date] Optional date to filter expenses by
 * @returns {Promise<ReturnExpenseSchema[]>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const getAllExpenses = async (date = null) => {
  try {
    const response = await api.get('/expenses/all', {
      params: {
        on: date ? new Date(date).toISOString().split('T')[0] : null
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Fetches all expenses for a given account
 * @param {number} accountId The ID of the account to fetch expenses for
 * @returns {Promise<ReturnExpenseSchema[]>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const getAllAccountExpenses = async (accountId) => {
  try {
    const response = await api.get(`/expenses/all?account_id=${accountId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching expenses:', error);
    throw error;
  }
}

/**
 * Creates a new expense record
 * @param {NewExpenseSchema} expenseData The expense data to create
 * @returns {Promise<ReturnExpenseSchema>} The created expense data
 * @throws {Error} If the API request fails
 */
export const createExpense = async (expenseData) => {
  try {
    const response = await api.post('/expenses/expense/new', expenseData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating expense:', error);
    throw error;
  }
}

/**
 * Fetches an expense by its ID
 * @param {number} expenseId The ID of the expense to fetch
 * @returns {Promise<ReturnExpenseSchema>} The expense data
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
 * Updates an expense record
 * @param {number} expenseId The ID of the expense to update
 * @param {NewExpenseSchema} expenseData The updated expense data
 * @returns {Promise<ReturnExpenseSchema>} The updated expense data
 * @throws {Error} If the API request fails
 */
export const updateExpense = async (expenseId, expenseData) => {
  try {
    const response = await api.put(`/expenses/expense/${expenseId}`, expenseData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error updating expense:', error);
    throw error;
  }
}

/**
 * Partially updates an expense record
 * @param {number} expenseId The ID of the expense to patch
 * @param {PatchExpenseSchema} expenseData The partial expense data to update
 * @returns {Promise<ReturnExpenseSchema>} The updated expense data
 * @throws {Error} If the API request fails
 */
export const patchExpense = async (expenseId, expenseData) => {
  try {
    const response = await api.patch(`/expenses/expense/${expenseId}`, expenseData);
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
    await api.delete(`/expenses/expense/${expenseId}`);
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting Expense:', error);
    throw error;
  }
}
