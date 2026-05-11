import axios from 'axios';

const productionApiBaseUrl = 'https://backend-production-7fbb.up.railway.app';

export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : productionApiBaseUrl)
);

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

export default api;
