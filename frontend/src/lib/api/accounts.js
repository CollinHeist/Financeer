import { api } from '@/lib/api';

import { ReturnAccountSchema } from './types';


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
    const { data } = await api.get(`/accounts/account/${accountId}`);
    return data;
  } catch (error) {
    console.error('Error fetching Account:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch Account');
  }
};

/**
 * Fetches the summary for an account
 * @param {number} accountId The ID of the account to fetch the summary for
 * @returns {Promise<Object>} The account summary data
 * @throws {Error} If the API request fails
 */
export const getAccountSummary = async (accountId) => {
  try {
    const response = await api.get(`/accounts/account/${accountId}/summary`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching account summary:', error);
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
