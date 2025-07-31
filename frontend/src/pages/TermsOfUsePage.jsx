// frontend/src/pages/TermsOfUsePage.jsx
import React from 'react';
import Navbar from '../components/Navbar'; // Mantém a Navbar
import '../styles/FaqPage.css';

const TermsOfUsePage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="content-wrapper page-content faq-content">
        <h1 className="page-title">Termos de Uso do Cápsula</h1>
        <p className="last-updated">Última atualização: 02 de Julho de 2025</p>

        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>Ao acessar ou usar o Cápsula ("Serviço"), você concorda em cumprir e estar vinculado por estes Termos de Uso ("Termos"). Se você não concorda com qualquer parte dos termos, não poderá acessar o Serviço. O Cápsula é operado por Cápsula Memórias Digitais Ltda, doravante "nós" ou "nosso".</p>
        </section>

        <section>
          <h2>2. O Serviço Cápsula</h2>
          <p>O Cápsula é uma plataforma digital projetada para permitir que os usuários criem e preservem suas memórias, experiências e pensamentos em formato de "cápsulas" digitais. Isso pode incluir texto, imagens, áudios e outros formatos de mídia. Nosso objetivo é ajudar você a "Viver Intensamente, Preservar para Sempre".</p>
        </section>

        <section>
          <h2>3. Contas de Usuário</h2>
          <h3>3.1. Registro</h3>
          <p>Para usar certos recursos do Serviço, você precisará se registrar para uma conta. Você concorda em fornecer informações precisas, completas e atualizadas durante o processo de registro.</p>
          <h3>3.2. Segurança da Conta</h3>
          <p>Você é responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem em sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.</p>
        </section>

        <section>
          <h2>4. Conteúdo do Usuário</h2>
          <h3>4.1. Propriedade</h3>
          <p>Você retém todos os direitos de propriedade intelectual sobre o conteúdo que você cria e carrega no Cápsula (suas "Cápsulas"). Nós não reivindicamos a propriedade de suas Cápsulas.</p>
          <h3>4.2. Licença</h3>
          <p>Ao carregar suas Cápsulas no Cápsula, você nos concede uma licença mundial, não exclusiva, livre de royalties, sublicenciável e transferível para hospedar, armazenar, usar, exibir, reproduzir e distribuir seu Conteúdo apenas para fins de operação e melhoria do Serviço.</p>
          <h3>4.3. Conteúdo Proibido</h3>
          <p>Você concorda em não carregar, postar ou transmitir qualquer Conteúdo que seja ilegal, difamatório, obsceno, pornográfico, abusivo, ameaçador, prejudicial, invasivo da privacidade alheia, ou que infrinja qualquer propriedade intelectual ou outros direitos de qualquer parte.</p>
        </section>

        <section>
          <h2>5. Limitação de Responsabilidade</h2>
          <p>O Cápsula e seus operadores não serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou exemplares, incluindo, entre outros, danos por perda de lucros, boa vontade, uso, dados ou outras perdas intangíveis, resultantes de (i) seu acesso, uso ou incapacidade de acessar ou usar o Serviço; (ii) qualquer conduta ou conteúdo de terceiros no Serviço; (iii) qualquer conteúdo obtido do Serviço; e (iv) acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo, seja com base em garantia, contrato, delito (incluindo negligência) ou qualquer outra teoria legal, quer tenhamos sido informados ou não da possibilidade de tal dano.</p>
        </section>

        <section>
          <h2>6. Alterações nos Termos</h2>
          <p>Reservamos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, faremos esforços razoáveis para fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.</p>
        </section>

        <section>
          <h2>7. Lei Aplicável</h2>
          <p>Estes Termos serão regidos e interpretados de acordo com as leis de Brasil / SP, sem considerar suas disposições sobre conflitos de leis.</p>
        </section>

        <section>
          <h2>8. Contato</h2>
          <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através do e-mail: contato@contato.com.br .</p>
        </section>
      </main>
      {/* <Footer /> */} {/* <--- Linha do Footer removida */}
      <style jsx>{`
        .page-content {
          padding-top: 1.5rem;
          padding-bottom: 2rem;
          line-height: 1.6;
          color: rgb(102, 102, 102);
        }
        .page-title {
          color: rgb(51, 51, 51);
          font-size: 2rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .last-updated {
          text-align: center;
          font-size: 0.9rem;
          color: rgb(102, 102, 102);
          margin-bottom: 2rem;
        }
        section {
          margin-bottom: 2rem;
        }
        section h2 {
          color: rgb(85, 85, 85);
          font-size: 1.5rem;
          margin-bottom: 0.8rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.4rem;
        }
        section h3 {
          color: rgb(85, 85, 85);
          font-size: 1.2rem;
          margin-top: 1.2rem;
          margin-bottom: 0.6rem;
        }
        p {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default TermsOfUsePage;