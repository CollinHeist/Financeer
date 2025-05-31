import { api } from '@/lib/api';

/**
 * Login with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<{access_token: string, token_type: string}>}
 */
export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/auth/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

/**
 * Register a new user (currently only creates default user)
 * @returns {Promise<void>}
 */
export const register = async () => {
  await api.post('/auth/register');
};

/**
 * Get current user information
 * @returns {Promise<{id: number, username: string, is_active: boolean, is_superuser: boolean}>}
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

