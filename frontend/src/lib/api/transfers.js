import { api } from '@/lib/api';
import {
  NewTransferSchema,
  PatchTransferSchema,
  ReturnTransferSchema,
} from './types';

/**
 * Fetches all transfers from the API
 * @returns {Promise<ReturnTransferSchema>} Array of transfer data
 * @throws {Error} If the API request fails
 */
export const getAllTransfers = async () => {
  try {
    const response = await api.get('/transfers/all');
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transfers:', error);
    throw error;
  }
}

/**
 * Fetches a transfer by ID
 * @param {number} transferId The ID of the transfer to fetch
 * @returns {Promise<ReturnTransferSchema>} The transfer data
 * @throws {Error} If the API request fails
 */
export const getTransferById = async (transferId) => {
  try {
    const response = await api.get(`/transfers/transfer/${transferId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transfer:', error);
    throw error;
  }
}

/**
 * Deletes a transfer
 * @param {number} transferId The ID of the transfer to delete
 * @returns {Promise<void>}
 * @throws {Error} If the API request fails
 */
export const deleteTransfer = async (transferId) => {
  try {
    const response = await api.delete(`/transfers/transfer/${transferId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting transfer:', error);
    throw error;
  }
}

/**
 * Fetches all transactions associated with a transfer
 * @param {number} transferId The ID of the transfer to fetch transactions for
 * @returns {Promise<ReturnTransactionSchemaNoAccount[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getTransferTransactions = async (transferId) => {
  try {
    const response = await api.get(`/transactions/transfer/${transferId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching transfer transactions:', error);
    throw error;
  }
}

/**
 * Create a new transfer
 * @param {Object} transferData The transfer data to create
 * @returns {Promise<ReturnTransferSchema>} The created transfer data
 * @throws {Error} If the API request fails
 */
export const createTransfer = async (transferData) => {
  try {
    const response = await api.post('/transfers/transfer/new', transferData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating transfer:', error);
    throw error;
  }
}

/**
 * Update a transfer
 * @param {number} transferId The ID of the transfer to update
 * @param {NewTransferSchema} transferData The transfer data to update
 * @returns {Promise<ReturnTransferSchema>} The updated transfer data
 * @throws {Error} If the API request fails
 */
export const updateTransfer = async (transferId, transferData) => {
  try {
    const response = await api.put(`/transfers/transfer/${transferId}`, transferData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error updating transfer:', error);
    throw error;
  }
}

/**
 * Partially updates a transfer
 * @param {number} transferId The ID of the transfer to patch
 * @param {PatchTransferSchema} transferData The partial transfer data to update
 * @returns {Promise<ReturnTransferSchema>} The updated transfer data
 * @throws {Error} If the API request fails
 */
export const patchTransfer = async (transferId, transferData) => {
  try {
    const response = await api.patch(`/transfers/transfer/${transferId}`, transferData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error patching transfer:', error);
    throw error;
  }
}
