import { api } from '@/lib/api';

/**
 * Fetches monthly cash flow data for an account
 * @param {number} accountId The ID of the account to fetch cash flow for
 * @param {string} startDate The start date in YYYY-MM-DD format
 * @param {string} endDate The end date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of monthly cash flow data
 * @throws {Error} If the API request fails
 */
export const getMonthlyCashFlow = async (accountId, startDate, endDate) => {
  try {
    const response = await api.get(`/cash-flow/monthly/${accountId}`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching monthly cash flow:', error);
    throw error;
  }
}
