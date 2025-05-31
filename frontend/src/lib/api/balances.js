import { api } from '@/lib/api';


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
