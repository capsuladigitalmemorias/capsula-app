 // frontend/src/components/Navbar.jsx
 import React, { useState } from 'react';
 import { Link } from 'react-router-dom';
 import { useAuth } from '../context/AuthContext';

 const Navbar = () => {
   const { logout } = useAuth();
   // Estado para controlar se o menu mobile está aberto ou fechado
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   // Função para alternar o estado do menu
   const toggleMenu = () => {
     setIsMenuOpen(!isMenuOpen);
   };

   // Função para fechar o menu ao clicar em um link (para mobile)
   const closeMenu = () => {
     setIsMenuOpen(false);
   };

   return (
     <nav className="navbar">
       <div className="navbar-content"> {/* Este é o contêiner centralizado */}
         {/* Novo contêiner para agrupar o logo e o botão hambúrguer no mobile */}
         <div className="navbar-header">
           <div className="nav-brand">
             <Link to="/dashboard" className="logo-link"> {/* Link para o Dashboard */}
               {/* HTML do Ícone da Cápsula */}
               <div className="logo-container">
                   <div className="logo-capsule-outer-wrapper">
                       <div className="logo-capsule-outer">
                           <div className="logo-capsule-inner">
                               <div className="logo-capsule-detail"></div>
                           </div>
                       </div>
                   </div>
                   <div className="logo-text">
                       Cápsula
                   </div>
               </div>
             </Link>
           </div>

           {/* Botão Hambúrguer (visível apenas no mobile via CSS) */}
           <button className="navbar-toggler" onClick={toggleMenu} aria-label="Toggle navigation">
             <span className="toggler-icon"></span>
             <span className="toggler-icon"></span>
             <span className="toggler-icon"></span>
           </button>
         </div>

         {/*
           Menu de Navegação
           A classe 'open' será adicionada/removida dinamicamente baseada no estado 'isMenuOpen'
         */}
         <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
           <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Início</Link>
           <Link to="/capsulas" className="nav-link" onClick={closeMenu}>Cápsulas</Link>
           <Link to="/analytics" className="nav-link" onClick={closeMenu}>Analytics</Link>
           <Link to="/timeline" className="nav-link" onClick={closeMenu}>Timeline</Link>
           <Link to="/instalar" className="nav-link" onClick={closeMenu}>Instalar</Link>
           <Link to="/profile" className="nav-link" onClick={closeMenu}>Meu Perfil</Link>
           <button onClick={() => { logout(); closeMenu(); }} className="nav-link logout-button-style">
             Sair
           </button>
         </div>
       </div>

       {/* BLOCO DE ESTILOS CSS PARA O NAVBAR */}
       <style jsx>{`
         .navbar {
           background-color: #fff; /* Fundo branco */
           border-bottom: 1px solid #e2e8f0; /* Borda inferior clara */
           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Sombra sutil para profundidade */
           padding: 1rem 0; /* Espaçamento vertical */
           position: sticky; /* Mantém a navbar no topo ao rolar */
           top: 0;
           z-index: 1000; /* Garante que fique acima de outros conteúdos */
         }

         .navbar-content {
           max-width: 1200px; /* Largura máxima para o conteúdo da navbar, alinhando com o content-wrapper */
           margin: 0 auto; /* Centraliza o conteúdo horizontalmente */
           padding: 0 1rem; /* Espaçamento horizontal interno para telas menores */
           display: flex;
           justify-content: space-between; /* Empurra o logo para a esquerda e o menu para a direita */
           align-items: center; /* Alinha os itens verticalmente ao centro */
           flex-wrap: wrap; /* Permite que os itens quebrem a linha no mobile */
         }

         /* Novo container para agrupar o logo e o botão hambúrguer no mobile */
         .navbar-header {
             display: flex;
             align-items: center;
             justify-content: space-between; /* Garante que logo e toggler fiquem nas extremidades */
             /* Margin-bottom só no mobile para separar do menu */
         }


         .nav-brand {
           display: flex;
           align-items: center;
           gap: 10px; /* Espaço entre o ícone do logo e o texto */
         }

         .logo-link {
             text-decoration: none; /* Remove sublinhado do link */
             color: inherit; /* Herda a cor do elemento pai */
             display: flex; /* Transforma o link em um contêiner flex para alinhamento do logo */
             align-items: center;
         }

         /* Estilos do Logo Capsula (ajustados para serem mais profissionais) */
         .logo-container {
             display: flex;
             align-items: center;
             gap: 8px; /* Espaço entre o círculo e o texto "Capsula" */
         }

         .logo-capsule-outer-wrapper {
             position: relative;
             width: 32px; /* Tamanho da cápsula externa */
             height: 32px;
             display: flex;
             justify-content: center;
             align-items: center;
         }

         .logo-capsule-outer {
             width: 100%;
             height: 100%;
             border: 2px solid #3182ce; /* Borda azul para a cápsula externa */
             border-radius: 50%; /* Torna-o circular */
             position: relative;
             display: flex;
             justify-content: center;
             align-items: center;
             box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.1);
         }

         .logo-capsule-inner {
             width: 50%;
             height: 50%;
             background-color: #bee3f8; /* Azul mais claro para o círculo interno */
             border-radius: 50%;
             position: relative;
             display: flex;
             justify-content: center;
             align-items: center;
             box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
         }

         .logo-capsule-detail {
             width: 30%;
             height: 30%;
             background-color: #90cdf4; /* Efeito de brilho/detalhe */
             border-radius: 50%;
             position: absolute;
             top: 10%;
             left: 10%;
             opacity: 0.7;
         }

         .logo-text {
             font-size: 1.8rem; /* Fonte maior para o texto "Capsula" */
             font-weight: 700; /* Negrito */
             color: #3b82f6; /* Texto cinza escuro */
             line-height: 1; /* Ajusta a altura da linha para melhor alinhamento */
         }

         /* Estilos para o Botão Hambúrguer (navbar-toggler) */
         .navbar-toggler {
             display: none; /* Escondido por padrão (desktop) */
             background: none;
             border: none;
             cursor: pointer;
             padding: 0.5rem;
             z-index: 1001; /* Garante que fique acima de tudo */
         }

         .toggler-icon {
             display: block;
             width: 28px;
             height: 3px;
             background-color: #4a5568; /* Cor das barrinhas */
             margin: 5px 0;
             transition: all 0.3s ease-in-out;
         }

         /* Estilos do Menu de Navegação (nav-menu) */
         .nav-menu {
           display: flex; /* Visível e em linha no desktop */
           gap: 1.5rem; /* Espaço entre os links de navegação */
           /* No desktop, não precisa de transição de altura, só hover */
         }

         .nav-link {
           text-decoration: none;
           color: #4a5568; /* Cinza mais escuro para os links */
           font-weight: 600; /* Semi-negrito */
           padding: 0.5rem 0.75rem; /* Padding para a área clicável */
           border-radius: 0.375rem; /* Cantos levemente arredondados */
           transition: background-color 0.2s ease, color 0.2s ease; /* Transição suave ao passar o mouse */
         }

         .nav-link:hover, .nav-link.active {
           background-color: #edf2f7; /* Fundo cinza claro ao passar o mouse/ativo */
           color: #2d3748; /* Texto mais escuro ao passar o mouse/ativo */
         }

         .logout-button-style {
             background: none;
             border: none;
             cursor: pointer;
             padding: 0.5rem 0.75rem; /* Mantém o padding consistente com nav-link */
             border-radius: 0.375rem;
             transition: background-color 0.2s ease, color 0.2s ease;
             color: #4a5568; /* Herda a cor do nav-link */
             font-weight: 600; /* Consistente com nav-link */
             white-space: nowrap; /* Evita quebra de linha para "Sair" */
         }

         .logout-button-style:hover {
             background-color: #edf2f7;
             color: #2d3748;
         }

         /* Ajustes responsivos para telas menores (smartphones) */
         @media (max-width: 768px) {
           .navbar-content {
             flex-direction: column; /* Empilha os itens verticalmente */
             align-items: flex-start; /* Alinha os itens ao início */
             padding: 0.5rem 1rem; /* Ajusta padding para mobile */
             justify-content: flex-start; /* Ajusta para mobile */
           }

           /* Nova regra para o navbar-header no mobile */
           .navbar-header {
             margin-bottom: 0.5rem; /* Espaço abaixo do logo/toggler e antes do menu */
             width: 100%; /* AGORA SÓ APLICADO NO MOBILE */
             display: flex;
             align-items: center;
             justify-content: space-between; /* Garante que o logo fique à esquerda e o toggler à direita */
           }

           /* No mobile, o nav-brand não precisa de margin-right: auto */
           .navbar-header .nav-brand {
               margin-right: 0; /* Anula qualquer margin-right:auto de tentativa anterior */
           }

           /* O botão hambúrguer é mostrado no mobile */
           .navbar-toggler {
             display: block; /* Mostra o botão hambúrguer */
           }

           /* As barrinhas do hambúrguer */
           .toggler-icon {
               display: block; /* Garante que as barras sejam visíveis */
           }

           /* O menu é escondido por padrão no mobile e preparado para animação */
           .nav-menu {
             display: none; /* ESCONDIDO POR PADRÃO NO MOBILE */
             flex-direction: column; /* Empilha os links verticalmente */
             width: 100%; /* Ocupa a largura total */
             max-height: 0; /* Menu fechado por padrão (para transição) */
             overflow: hidden; /* Esconde o conteúdo que exceder max-height */
             padding-bottom: 0; /* Remove padding inferior quando fechado */
             opacity: 0; /* Começa invisível */
             pointer-events: none; /* Impede cliques quando invisível */
             transition: max-height 0.3s ease-out, padding-bottom 0.3s ease-out, opacity 0.3s ease-out;
           }

           /* Quando o menu está aberto */
           .nav-menu.open {
             display: flex; /* APENAS AGORA ELE É FLEX QUANDO ABERTO */
             max-height: 500px; /* Altura suficiente para mostrar todos os links */
             padding-bottom: 1rem; /* Adiciona padding inferior ao abrir */
             opacity: 1; /* Torna visível */
             pointer-events: auto; /* Permite cliques */
           }

           .nav-link, .logout-button-style {
             width: 100%; /* Ocupa a largura total para a área clicável */
             text-align: left; /* Alinha o texto do link à esquerda no mobile */
             padding: 0.75rem 1rem; /* Padding generoso para toque */
           }
         }
       `}</style>
     </nav>
   );
 };

 export default Navbar;