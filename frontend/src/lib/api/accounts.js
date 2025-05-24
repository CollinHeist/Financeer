import { api } from '@/lib/api';
import { NewAccountSchema, ReturnAccountSchema } from './types';


/**
 * Fetches all accounts from the API
 * @returns {Promise<ReturnAccountSchema[]>} Array of account data
 * @throws {Error} If the API request fails
 */
export const getAllAccounts = async () => {
  // Add an intentional delay for development/testing purposes
  try {
    const { data } = await api.get('/accounts/all');
    return data;
  } catch (error) {
    console.error('Error fetching Accounts:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch Accounts');
  }
};

/**
 * Fetches an account by its ID
 * @param {number} accountId The ID of the account to fetch
 * @returns {Promise<ReturnAccountSchema>} The account data
 * @throws {Error} If the API request fails
 */
export const getAccount = async (accountId) => {
  try {
    const { data } = await api.get(`/accounts/${accountId}`);
    return data;
  } catch (error) {
    console.error('Error fetching Account:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch Account');
  }
};
