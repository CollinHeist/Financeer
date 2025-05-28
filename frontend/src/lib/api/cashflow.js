import { api } from '@/lib/api';

import {
  DailyExpenseComparison,
  ReturnMonthlyAccountSnapshotSchema,
} from './types';

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

/**
 * Fetches average daily expenses for an account
 * @param {number} accountId The ID of the account to fetch expenses for
 * @param {string} startDate The start date in YYYY-MM-DD format
 * @param {string} endDate The end date in YYYY-MM-DD format
 * @returns {Promise<DailyExpenseComparison[]>} Array of average daily expenses data
 * @throws {Error} If the API request fails
 */
export const getAverageDailyExpenses = async (accountId, startDate, endDate) => {
  try {
    const response = await api.get(`/cash-flow/average-daily-expenses/account/${accountId}`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching average daily expenses:', error);
    throw error;
  }
}

/**
 * Fetches a snapshot of the monthly cash flow for an account
 * @param {number} accountId The ID of the account to fetch snapshot for
 * @param {string} startDate The start date in YYYY-MM-DD format
 * @param {string} endDate The end date in YYYY-MM-DD format
 * @returns {Promise<ReturnMonthlyAccountSnapshotSchema[]>} Array of monthly account snapshot data
 * @throws {Error} If the API request fails
 */
export const getMonthlyAccountSnapshot = async (accountId, startDate, endDate) => {
  try {
    const response = await api.get(`/cash-flow/monthly/account/${accountId}/snapshot`, {
      params: {
        start_date: startDate,
        end_date: endDate
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data?.detail || 'Error fetching monthly account snapshot:', error);
    throw error;
  }
}
