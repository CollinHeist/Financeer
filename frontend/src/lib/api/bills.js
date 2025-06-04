import { api } from '@/lib/api';

import {
  NewBillSchema,
  PatchBillSchema,
  ReturnBillSchema,
} from './types';

/**
 * Fetches all to and from expenses for an account from the API
 * @param {NewBillSchema} billData The data for the new bill
 * @returns {Promise<ReturnBillSchema>} Array of expense data
 * @throws {Error} If the API request fails
 */
export const createBill = async (billData) => {
  try {
    const response = await api.post('/bills/bill/new', billData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error creating new Bill:', error);
    throw error;
  }
}

/**
 * Fetches a bill by its ID from the API
 * @param {number} billId The ID of the bill to fetch
 * @returns {Promise<ReturnBillSchema>} The bill data
 * @throws {Error} If the API request fails
 */
export const getBillById = async (billId) => {
  try {
    const response = await api.get(`/bills/bill/${billId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching Bill:', error);
    throw error;
  }
}

/**
 * Patches a bill by its ID from the API
 * @param {number} billId The ID of the bill to patch
 * @param {PatchBillSchema} billData The data for the bill
 * @returns {Promise<ReturnBillSchema>} The patched bill data
 * @throws {Error} If the API request fails
 */
export const patchBill = async (billId, billData) => {
  try {
    const response = await api.patch(`/bills/bill/${billId}`, billData);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error patching Bill:', error);
    throw error;
  }
}

/**
 * Deletes a bill by its ID from the API
 * @param {number} billId The ID of the bill to delete
 * @returns {Promise<void>} The deleted bill data
 * @throws {Error} If the API request fails
 */
export const deleteBill = async (billId) => {
  try {
    const response = await api.delete(`/bills/bill/${billId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error deleting Bill:', error);
    throw error;
  }
}

/**
 * Fetches all bills from the API
 * @returns {Promise<ReturnBillSchema[]>} Array of bill data
 * @throws {Error} If the API request fails
 */
export const getAllBills = async () => {
  try {
    const response = await api.get('/bills/all');
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching all bills:', error);
    throw error;
  }
}

/**
 * Fetches all bills for an account from the API
 * @param {number} accountId The ID of the account to fetch bills for
 * @returns {Promise<ReturnBillSchema[]>} Array of bill data
 * @throws {Error} If the API request fails
 */
export const getAllAccountBills = async (accountId) => {
  try {
    const response = await api.get(`/bills/account/${accountId}/all`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching Bills:', error);
    throw error;
  }
}

/**
 * Fetches all transactions for a bill from the API
 * @param {number} billId The ID of the bill to fetch transactions for
 * @returns {Promise<ReturnTransactionSchema[]>} Array of transaction data
 * @throws {Error} If the API request fails
 */
export const getBillTransactions = async (billId) => {
  try {
    const response = await api.get(`/transactions/bill/${billId}`);
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching Bill Transactions:', error);
    throw error;
  }
}