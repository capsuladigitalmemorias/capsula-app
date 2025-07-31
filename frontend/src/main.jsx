// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx'; // Importe o AuthProvider

/*const currentPath = window.location.pathname;

Se a URL começar com /admin, forçamos um full page reload para que o servidor Flask-Admin responda.
Isso impede que o React Router tente lidar com a rota internamente.
if (currentPath.startsWith('/admin')) {
  console.log("Tentativa de acesso a /admin detectada. Forçando um recarregamento completo da página para que o servidor lide com isso.");
  window.location.replace() é preferível a window.location.href para não adicionar a URL ao histórico de navegação.
  E ele força uma nova requisição, ignorando o histórico atual do SPA.
  window.location.replace(currentPath);
  Retornar null ou lançar um erro para que o React não tente renderizar nada nesta situação.
  O browser fará o redirecionamento.
  IMPORTANTE: Este trecho DEVE ser executado antes da renderização do React.
  throw new Error('Forçando recarregamento para /admin. O React não será inicializado.'); // Para parar a execução do script
}*/



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* Envolve seu App com o AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);