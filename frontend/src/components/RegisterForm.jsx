import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const RegisterForm = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const emailFromUrl = queryParams.get('email')
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await register(name, email, password)

    if (result.success) {
      setSuccess('Conta criada com sucesso! Faça login para continuar.')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo">
          <h1>Capsula</h1>
          <p>Viva Intensamente. Preserve Para Sempre.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '24px', color: '#2d3748' }}>Criar Conta</h2>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>

          <p className="auth-switch">
            Já tem conta? <Link to="/login">Entre aqui</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default RegisterForm
