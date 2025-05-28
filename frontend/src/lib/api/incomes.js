import { api } from '@/lib/api';

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
