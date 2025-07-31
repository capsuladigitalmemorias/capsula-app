 // frontend/src/pages/ForgotPasswordPage.jsx
 import React, { useState } from 'react';
 import { Link } from 'react-router-dom';
 import api from '../services/api'; // Supondo o mesmo serviço de API
 
 const ForgotPasswordPage = () => {
   const [email, setEmail] = useState('');
   const [message, setMessage] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
 
   const handleSubmit = async (e) => {
     e.preventDefault();
     setMessage('');
     setError('');
     setLoading(true);
 
     try {
       // Este endpoint precisará ser criado no seu backend Flask
       // Ele enviará um e-mail com um link de redefinição para o usuário
       const response = await api.post('/api/auth/forgot-password', { email });
+      setMessage(response.data.message || 'Se um e-mail correspondente for encontrado, um link para redefinir a senha foi enviado.');
     } catch (err) {
       console.error('Erro ao solicitar redefinição:', err);
       setError(err.response?.data?.message || 'Ocorreu um erro. Por favor, tente novamente.');
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="auth-container">
       <div className="auth-card">
         <h2 style={{ marginBottom: '24px', color: '#2d3748' }}>Redefinir Senha</h2>
 
         {message && (
           <div className="alert alert-success">
             {message}
           </div>
         )}
         {error && (
           <div className="alert alert-error">
             {error}
           </div>
         )}
 
         <p style={{ marginBottom: '16px', color: '#4a5568', fontSize: '0.9rem' }}>
           Informe seu endereço de e-mail e enviaremos um link para você redefinir sua senha.
         </p>
 
         <form onSubmit={handleSubmit}>
           <div className="form-group">
             <input
               type="email"
               className="form-input"
               placeholder="Seu email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
               disabled={loading}
             />
           </div>
 
           <button
             type="submit"
             className="btn btn-primary"
             disabled={loading}
           >
             {loading ? 'Enviando...' : 'Enviar link de redefinição'}
           </button>
         </form>
 
         <p className="auth-switch" style={{ marginTop: '20px' }}>
           Lembrou da senha? <Link to="/login">Voltar para o Login</Link>
         </p>
       </div>
       <style jsx>{`
         .auth-container {
           display: flex;
           justify-content: center;
           align-items: center;
           min-height: 100vh;
           background-color: #f0f2f5;
         }
         .auth-card {
           background-color: #ffffff;
           padding: 2.5rem;
           border-radius: 8px;
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
           width: 100%;
           max-width: 450px;
           text-align: center;
         }
         .form-group {
           margin-bottom: 1rem;
         }
         .form-input {
           width: 100%;
           padding: 0.75rem;
           border: 1px solid #e2e8f0;
           border-radius: 4px;
           font-size: 1rem;
           box-sizing: border-box;
         }
         .form-input:focus {
           outline: none;
           border-color: #4299e1;
           box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
         }
         .btn-primary {
           width: 100%;
           padding: 0.85rem;
           background-color: #4299e1;
           color: white;
           border: none;
           border-radius: 4px;
           font-size: 1.1rem;
           font-weight: 700;
           cursor: pointer;
           transition: background-color 0.2s ease;
           margin-top: 1.5rem;
         }
         .btn-primary:hover:not(:disabled) {
           background-color: #3182ce;
         }
         .btn-primary:disabled {
           background-color: #a0aec0;
           cursor: not-allowed;
         }
         .alert {
           padding: 0.75rem;
           border-radius: 4px;
           margin-bottom: 1rem;
           text-align: left;
           font-size: 0.9rem;
         }
         .alert-error {
           background-color: #fed7d7;
           color: #e53e3e;
           border: 1px solid #fc8181;
         }
         .alert-success {
           background-color: #c6f6d5;
           color: #2f855a;
           border: 1px solid #68d391;
         }
         .auth-switch {
           margin-top: 1rem;
           font-size: 0.9rem;
           color: #718096;
         }
         .auth-switch a {
           color: #4299e1;
           text-decoration: none;
           font-weight: 600;
         }
         .auth-switch a:hover {
           text-decoration: underline;
         }
       `}</style>
     </div>
   );
 };
 
 export default ForgotPasswordPage;