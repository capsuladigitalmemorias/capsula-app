// src/services/auth.js
import api from './api'; // Importa a instância do Axios configurada

const authService = {
  login: async (email, password) => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (name, email, password) => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.post('/api/auth/register', { name, email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.get('/api/auth/me');
    return response.data.user;
  },

  updateProfile: async (name, email) => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.put('/api/users/profile', { name, email });
    return response.data.user;
  },

  updatePassword: async (current_password, new_password, confirm_new_password) => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.put('/api/users/password', { current_password, new_password, confirm_new_password });
    return response.data.message;
  },

  deleteAccount: async (password) => {
    // CORREÇÃO: Adicionado /api/
    const response = await api.delete('/api/users/me', { data: { password } });
    return response.data.message;
  }
};

export default authService;