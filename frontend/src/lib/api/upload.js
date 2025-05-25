import { api } from '@/lib/api';

import { ReturnTransactionSchema } from './types';


/**
 * Uploads transactions to the API
 * @param {string} type - The type of transactions to upload
 * @param {File[]} files - The files to upload
 * @param {number} accountId - The ID of the account to upload the transactions to
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const uploadTransactions = async (type, files, accountId) => {
  let url;
  switch (type) {
    case 'apple':
      url = '/uploads/new/apple';
      break;
    case 'capital-one':
      url = '/uploads/new/capital-one';
      break;
    case 'chase':
      url = '/uploads/new/chase';
      break;
    case 'iccu':
      url = '/uploads/new/iccu';
      break;
    case 'citi':
      url = '/uploads/new/citi';
      break;
    case 'vanguard':
      url = '/uploads/new/vanguard';
      break;
    default:
      url = '/uploads/new/generic';
  }

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post(`${url}?account_id=${accountId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error uploading Transactions:', error);
    throw error;
  }
}
