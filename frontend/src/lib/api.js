import axios from 'axios';

const configuredApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
);

export const apiBaseUrl = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : (import.meta.env.DEV ? 'http://localhost:3001' : '');

export const allowMockData = (
  import.meta.env.DEV
  || import.meta.env.VITE_ALLOW_MOCK_DATA === 'true'
);

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 10000,
});

export default api;
