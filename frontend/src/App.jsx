// /home/Wilder/capsula/frontend/src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Instalar from './pages/Instalar'; // Ajuste o caminho se estiver diferente

// Seus imports de componentes...
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import CreateCapsulePage from './components/CreateCapsule';
import CapsulesPage from './components/CapsulesPage';
import UserProfilePage from './components/UserProfile';
import ViewCapsulePage from './components/ViewCapsulePage';
import AnalyticsPage from './pages/AnalyticsPage';
import TimelinePage from './pages/TimelinePage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import TermsOfUsePage from './pages/TermsOfUsePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import Footer from './components/Footer';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import './index.css';
import './App.css';
import './GlobalStyles.css';


const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () =>
  (window.matchMedia('(display-mode: standalone)').matches) ||
  (window.navigator.standalone === true);

const InstallPWAButton = ({ deferredPrompt }) => {
  const [showButton, setShowButton] = useState(!!deferredPrompt);

  useEffect(() => {
    setShowButton(!!deferredPrompt);
  }, [deferredPrompt]);

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowButton(false);
    }
  };

  if (!showButton) return null;
  return (
    <button onClick={handleClick} style={{ margin: '16px', padding: '10px 25px', background: '#164977', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
      Instalar aplicativo no seu dispositivo
    </button>
  );
};

const IosInstallBanner = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.96)',
      boxShadow: '0 2px 8px 0 rgba(0,0,0,.08)',
      zIndex: 1001,
      textAlign: 'center', padding: '22px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Como instalar no iPhone</div>
      <div style={{ fontSize: 15 }}>
        1. Toque no <span style={{ fontWeight: 600 }}>&#x2191;</span> no Safari.<br />
        2. Depois, selecione <b>Adicionar à Tela de Início</b>.<br />
        <br />
        <button onClick={onClose} style={{ marginTop: 10, background: '#444', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 18px', cursor: 'pointer' }}>Fechar</button>
      </div>
    </div>
  );
};

const PWAInstallHelper = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Captura o evento de instalação para Android/Chrome Desktop
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isIos() && !isInStandaloneMode()) {
    return null;(
      <div style={{ position: 'fixed', right: 16, bottom: 90, zIndex: 1000 }}>
        <a
          href="#"
          style={{
            fontSize: 14,
            color: '#3775b6',
            textDecoration: 'underline',
            background: '#fff',
            border: '1px solid #e6e6e6',
            borderRadius: 10,
            padding: '8px 15px',
            boxShadow: '0 2px 10px #0001'
          }}
          onClick={e => {
            e.preventDefault();
            setShowIosTip(true);
          }}
        >
          Como instalar o app no iPhone?
        </a>
        <IosInstallBanner open={showIosTip} onClose={() => setShowIosTip(false)} />
      </div>
    );
  }

  if (deferredPrompt && !isIos()) {
    // Mostra botão só para quem pode instalar via prompt do PWA
    return (
      <div style={{ position: 'fixed', right: 16, bottom: 90, zIndex: 1000 }}>
        <InstallPWAButton deferredPrompt={deferredPrompt} />
      </div>
    );
  }
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.5em', color: '#3b82f6' }}>Carregando dados de autenticação...</div>;
  }
  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.5em', color: '#dc2626' }}>Acesso Negado. Redirecionando para o Login...</div>;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app-layout-container">
        <PWAInstallHelper />
        <div className="main-content-area-for-routes">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/criar-capsula" element={<ProtectedRoute><CreateCapsulePage /></ProtectedRoute>} />
            <Route path="/capsulas" element={<ProtectedRoute><CapsulesPage /></ProtectedRoute>} />
            <Route path="/capsulas/:capsuleId" element={<ProtectedRoute><ViewCapsulePage /></ProtectedRoute>} />
            <Route path="/editar-capsula/:capsuleId" element={<ProtectedRoute><CreateCapsulePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
            <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/instalar" element={<Instalar />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;