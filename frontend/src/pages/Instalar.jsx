// frontend/src/pages/Instalar.jsx
import React from 'react';
import "./instalar.css";
import Navbar from '../components/Navbar';
import shareIconBlue from '../assets/share-icon-blue.png';

export default function Instalar() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="instalar-container">
        <h1>Como instalar o Capsula no seu dispositivo</h1>

      <h2>📱 iPhone/iPad (usando Safari)</h2>
      <ol>
        <li>Acesse o Capsula usando o navegador <b>Safari</b> no seu iPhone ou iPad.</li>
        <li>No rodapé da tela, toque no ícone <b>Compartilhar</b>
          <img src={shareIconBlue} alt="Ícone de Compartilhar do Safari" className="icon-share-safari" /> (um quadrado com uma seta para cima).
        </li>
        <li>Desça as opções e toque em <b>Adicionar à Tela de Início</b>.
        </li>
        <li>Confirme tocando em <b>Adicionar</b> no canto superior direito.</li>
        <li>O Capsula estará disponível como um app na sua tela inicial!</li>
      </ol>

      <h2>🌐 iPhone/iPad (outros navegadores)</h2>
      <ul>
        <li>Infelizmente, só o <b>Safari</b> permite a instalação como app direto na tela inicial do iOS.</li>
        <li>Se estiver usando Chrome, Firefox ou outro navegador, copie o endereço do Capsula, abra no Safari e siga os passos acima.</li>
      </ul>

      <h2>🤖 Android (Chrome, Samsung Internet, Edge...)</h2>
      <ol>
        <li>Acesse o Capsula usando o navegador <b>Chrome</b> ou <b>Samsung Internet</b> do seu celular.</li>
        <li>Toque no menu <b>Mais opções</b>
          <span aria-label="ícone três pontinhos">⋮</span> (ícone com três pontos no canto superior direito).
        </li>
        <li>Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.<br />
        (O texto pode variar conforme o navegador.)</li>
        <li>Confirme a instalação.<br />
          O Capsula estará na tela inicial como app independente!
        </li>
      </ol>

      <h2>💻 Computador (Windows, Mac - Chrome, Edge...)</h2>
      <ol>
        <li>Acesse o Capsula usando um navegador compatível, como <b>Chrome</b> ou <b>Edge</b>.</li>
        <li>Procure um ícone de <b>download</b> ou <b>“Instalar app”</b> ao lado do endereço na barra do navegador.<br />
        (No Chrome, é um botão com símbolo de monitor/computador, geralmente no canto direito da barra de endereço.)
        </li>
        <li>Clique em <b>Instalar</b> e siga as instruções na tela.</li>
        <li>O Capsula será instalado como app no seu computador e estará disponível na sua área de trabalho!</li>
      </ol>

      <h2>❓ Dúvidas?</h2>
      <ul>
        <li>Se não aparecer a opção de instalar, certifique-se de estar usando os navegadores recomendados acima.</li>
        <li>Se persistir, informe-nos para podermos ajudar!</li>
      </ul>
    </div>
      </div>
   );
}