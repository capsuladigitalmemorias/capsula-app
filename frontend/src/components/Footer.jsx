// frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        {/* Alterado 'Capsula' para 'Cápsula' para consistência */}
        <p>&copy; {new Date().getFullYear()} Cápsula. Todos os direitos reservados.</p>
        <div className="footer-links">
          <Link to="/termos-de-uso">Termos de Uso</Link>
          <span className="separator">|</span>
          <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          <span className="separator">|</span>
          <Link to="/contato">Contato</Link>
          <span className="separator">|</span>
          <Link to="/faq">Dúvidas Frequentes</Link>
        </div>
      </div>
      <style jsx>{`
        .app-footer {
          background-color: var(--color-primary-dark);
          color: var(--text-color-light);
          padding: 1.5rem 1rem;
          text-align: center; /* Centraliza todo o texto e elementos inline/inline-block */
          margin-top: 3rem; /* Espaço para separar do conteúdo principal */
          font-size: 0.9rem;
          box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
        }

        .footer-content {
          max-width: 900px;
          margin: 0 auto; /* Centraliza o bloco do conteúdo */
          /* Removido display: flex e flex-direction para mobile, usando text-align para centralizar */
        }

        .footer-content p {
          margin-bottom: 0.8rem; /* Adiciona espaçamento entre o parágrafo e os links em telas pequenas */
        }

        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center; /* Garante que os links dentro do seu próprio container flex sejam centralizados */
          gap: 0.5rem;
        }

        .footer-links a {
          color: var(--text-color-light);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--accent-light);
        }

        .separator {
          color: var(--text-color-light);
          margin: 0 0.2rem;
        }

        /* Regras para telas maiores (desktop) */
        @media (min-width: 768px) {
          .footer-content {
            display: flex; /* Ativa o flexbox para layout em linha no desktop */
            flex-direction: row;
            justify-content: space-between; /* Espaça o copyright e os links nas extremidades */
            align-items: center; /* Alinha os itens verticalmente ao centro */
          }
          .footer-content p {
            margin-bottom: 0; /* Remove a margem extra quando em layout de linha */
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;