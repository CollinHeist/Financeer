import { api } from '@/lib/api';

import { NewLinkAccountSchema } from '@/lib/api/types';
import { ReturnAccountInfoSchema } from '@/lib/api_types';


/**
 * Creates a link token for initializing Plaid Link
 * @returns {Promise<string>} The link token
 * @throws {Error} If the API request fails
 */
export const createLinkToken = async () => {
  try {
    const { data } = await api.post('/plaid/link-token');
    return data.link_token;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create link token');
  }
};

/**
 * Exchanges a public token for an access token
 * @param {string} publicToken The public token received from Plaid Link
 * @returns {Promise<string>} The access token
 * @throws {Error} If the API request fails
 */
export const exchangePublicToken = async (publicToken) => {
  try {
    const { data } = await api.post('/plaid/exchange-token', {
      public_token: publicToken
    });
    return data.access_token;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw new Error(error.response?.data?.detail || 'Failed to exchange public token');
  }
};

/**
 * Gets the stored access token for the current user
 * @returns {Promise<string>} The access token
 * @throws {Error} If the API request fails
 */
export const getStoredAccessToken = async () => {
  try {
    const { data } = await api.get('/plaid/access-token');
    return data.access_token;
  } catch (error) {
    console.error('Error getting stored access token:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get stored access token');
  }
};

/**
 * Gets account information from Plaid
 * @param {string | null} plaidItemId The Plaid item ID
 * @returns {Promise<ReturnAccountInfoSchema[]>} Array of account information
 * @throws {Error} If the API request fails
 */
export const getPlaidAccounts = async (plaidItemId) => {
  try {
    const { data } = await api.get('/plaid/accounts', {
      params: { plaid_item_id: plaidItemId }
    });
    return data;
  } catch (error) {
    console.error('Error getting Plaid accounts:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get Plaid accounts');
  }
};

/**
 * Gets transactions from Plaid
 * @param {string} accessToken The access token for the item
 * @param {Date} startDate Start date for transactions
 * @param {Date} endDate End date for transactions
 * @param {Array<string>} accountIds Optional array of account IDs to filter by
 * @returns {Promise<Object>} Object containing transactions and total count
 * @throws {Error} If the API request fails
 */
export const getPlaidTransactions = async (accessToken, startDate, endDate, accountIds = null) => {
  try {
    const { data } = await api.get('/plaid/transactions', {
      params: {
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        account_ids: accountIds
      }
    });
    console.log('Received transactions data:', data);
    return data;
  } catch (error) {
    console.error('Error getting Plaid transactions:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get Plaid transactions');
  }
};

/**
 * Links an existing account with a Plaid account
 * @param {NewLinkAccountSchema} linkAccountRequest The request containing the Plaid account ID, PlaidItem ID, and Account ID
 * @returns {Promise<Object>} The updated account data
 * @throws {Error} If the API request fails
 */
export const linkPlaidAccount = async (accountLink) => {
  try {
    const response = await api.post(`/plaid/link-account`, accountLink);
    return response.data;
  } catch (error) {
    console.error('Error linking Plaid account:', error);
    throw new Error(error.response?.data?.detail || 'Failed to link Plaid account');
  }
};
