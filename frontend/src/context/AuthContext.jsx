// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth'; // Presume que authService.login/register retornam {token, user} ou lançam erro
import api from '../services/api';
// Não é necessário importar useNavigate se você estiver usando window.location.href para o redirecionamento.
// import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Se você fosse usar useNavigate, ele seria inicializado aqui:
  // const navigate = useNavigate();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];

    // --- AQUI ESTÁ A CORREÇÃO SUGERIDA ---
    // Força um reload completo da página inicial, limpando o estado do navegador.
    window.location.href = '/';
    // Se preferir um redirecionamento dentro do React Router SEM forçar um reload,
    // você usaria 'navigate('/login');' (se 'login' for a rota de login do seu app React)
    // mas precisaria importar e inicializar useNavigate e adicionar 'navigate' às dependências do useCallback.
    // Para o problema do Admin e Ctrl+Shift+R, window.location.href é mais robusto.
    // -------------------------------------

  }, []); // Note: Como não estamos usando 'navigate' aqui, a lista de dependências pode ser vazia.

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Garante que o token é válido tentando buscar os dados do usuário
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Falha ao buscar usuário com token existente:', error);
          logout(); // Se o token for inválido/expirado, desloga
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    initializeAuth();
  }, [token, logout]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Se for um erro 401 (não autorizado) e não for uma rota de login/registro (que já trata 401)
        if (error.response && error.response.status === 401 &&
            !error.config.url.includes('/auth/login') &&
            !error.config.url.includes('/auth/register')) {
          logout(); // Desloga o usuário
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  // --- Funções login e register ---
  const login = async (email, password) => {
    try {
      // authService.login deve retornar { token, user } em caso de sucesso
      const data = await authService.login(email, password);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Retorna o formato que LoginForm.jsx espera para sucesso
      return { success: true, message: 'Login realizado com sucesso!' };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      // Extrai a mensagem de erro da resposta do Axios, se disponível, ou uma mensagem genérica
      const errorMessage = error.response?.data?.message || 'Erro desconhecido ao fazer login.';
      // Retorna o formato que LoginForm.jsx espera para erro
      return { success: false, message: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      // authService.register deve retornar { token, user } em caso de sucesso
      const data = await authService.register(name, email, password);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Retorna o formato que RegisterForm.jsx espera para sucesso
      return { success: true, message: 'Registro realizado com sucesso! Você já pode entrar.' };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      const errorMessage = error.response?.data?.message || 'Erro desconhecido ao registrar.';
      // Retorna o formato que RegisterForm.jsx espera para erro
      return { success: false, message: errorMessage };
    }
  };
  // --- FIM DA CORREÇÃO ---


  const updateProfile = async (name, email) => {
      try {
          const updatedUser = await authService.updateProfile(name, email);
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return { success: true, message: 'Perfil atualizado com sucesso!' };
      } catch (error) {
          console.error('Erro ao atualizar perfil:', error);
          const errorMessage = error.response?.data?.message || 'Erro desconhecido ao atualizar perfil.';
          return { success: false, message: errorMessage };
      }
  };

  const updatePassword = async (current_password, new_password, confirm_new_password) => {
      try {
          const message = await authService.updatePassword(current_password, new_password, confirm_new_password);
          return { success: true, message: message || 'Senha atualizada com sucesso!' };
      } catch (error) {
          console.error('Erro ao atualizar senha:', error);
          const errorMessage = error.response?.data?.message || 'Erro desconhecido ao atualizar senha.';
          return { success: false, message: errorMessage };
      }
  };

  const deleteAccount = async (password) => {
      try {
          const message = await authService.deleteAccount(password);
          logout(); // Desloga o usuário após a exclusão da conta
          return { success: true, message: message || 'Conta excluída com sucesso!' };
      } catch (error) {
          console.error('Erro ao excluir conta:', error);
          const errorMessage = error.response?.data?.message || 'Erro desconhecido ao excluir conta.';
          return { success: false, message: errorMessage };
      }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, updatePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};