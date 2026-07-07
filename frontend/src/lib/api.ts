import axios from 'axios';
import { BUSINESS } from '../config/business.config';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(BUSINESS.storageKeys.authToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
