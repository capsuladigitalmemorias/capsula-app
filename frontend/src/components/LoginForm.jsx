import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// --- ALTERAÇÃO 1: Importar useNavigate ---
import { Link, useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  // --- ALTERAÇÃO 2: Inicializar o navigate ---
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    // --- ALTERAÇÃO 3: Lógica completa de tratamento ---
    if (result.success) {
      // Se o login foi um sucesso, navegue para o dashboard!
      navigate('/dashboard');
    } else {
      // Se não, mostre a mensagem de erro.
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <h1>Cápsula</h1>
          <p>Viva intensamente. Preserve para sempre.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '24px', color: '#2d3748' }}>Entrar</h2>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              className="form-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="auth-switch">
            Não tem uma assinatura? <Link to="/assinaturas">Assine Agora</Link>
          </p>

          {/* NOVO: Link de Esqueci minha senha */}
          <div style={{ marginTop: '20px' }} className="forgot-password-link">
            <Link to="/forgot-password" className="text-link">Esqueci minha senha</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;