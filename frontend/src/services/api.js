// src/services/api.js
import axios from 'axios';

// --- CORREÇÃO AQUI ---
// VITE_API_BASE_URL deve ser definido como o domínio base do seu backend,
// ou simplesmente '/' se o frontend e backend estiverem no mesmo domínio/porta.
// O fallback agora é '/' (raiz) em vez de '/api'.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    // 'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;