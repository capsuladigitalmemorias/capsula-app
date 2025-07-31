// frontend/src/pages/PrivacyPolicyPage.jsx
import React from 'react';
import Navbar from '../components/Navbar'; // Mantém a Navbar
import '../styles/FaqPage.css'; // Contém a definição de .faq-content

const PrivacyPolicyPage = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="content-wrapper page-content faq-content">
        <h1 className="page-title">Política de Privacidade do Cápsula</h1>
        <p className="last-updated">Última atualização: 02 de Julho de 2025</p>

        <section>
          <h2>1. Introdução</h2>
          <p>A sua privacidade é de extrema importância para nós. Esta Política de Privacidade descreve como o Cápsula ("Serviço"), operado por Cápsula Memórias Digitais Ltda, coleta, usa, compartilha e protege suas informações pessoais. Ao usar o Serviço, você concorda com as práticas descritas nesta política.</p>
        </section>

        <section>
          <h2>2. Informações que Coletamos</h2>
          <h3>2.1. Informações Fornecidas por Você</h3>
          <ul>
            <li><strong>Dados de Registro:</strong> Quando você cria uma conta, coletamos seu nome e endereço de e-mail.</li>
            <li><strong>Conteúdo da Cápsula:</strong> As memórias que você decide criar e armazenar no Serviço incluem: textos, descrições, títulos, humores associados (emojis), tags, localização (opcional), datas das cápsulas e arquivos de mídia (imagens, áudios).</li>
          </ul>
          <h3>2.2. Informações Coletadas Automaticamente</h3>
          <ul>
            <li><strong>Dados de Uso:</strong> Coletamos informações sobre como você acessa e usa o Serviço, como seu endereço IP, tipo de navegador, sistema operacional, páginas visitadas, tempo gasto nas páginas e horários de acesso.</li>
          </ul>
        </section>

        <section>
          <h2>3. Como Usamos Suas Informações</h2>
          <p>Usamos as informações coletadas para os seguintes propósitos:</p>
          <ul>
            <li><strong>Para Fornecer e Manter o Serviço:</strong> Incluindo o gerenciamento de sua conta e o acesso às suas Cápsulas.</li>
            <li><strong>Para Personalizar Sua Experiência:</strong> Adaptando o Serviço às suas preferências.</li>
            <li><strong>Para Melhorar o Serviço:</strong> Analisando como o Serviço é usado para aprimorar funcionalidades e resolver problemas.</li>
            <li><strong>Para Segurança:</strong> Protegendo o Cápsula e seus usuários contra atividades fraudulentas ou maliciosas.</li>
            <li><strong>Para Comunicação:</strong> Enviando avisos importantes sobre o Serviço ou sua conta.</li>
          </ul>
        </section>

        <section>
          <h2>4. Compartilhamento de Informações</h2>
          <p>Não vendemos, alugamos ou comercializamos suas informações pessoais a terceiros.</p>
          <ul>
            <li><strong>Provedores de Serviço:</strong> Podemos compartilhar informações com terceiros que nos auxiliam na operação do Serviço (ex: PythonAnywhere para hospedagem). Esses provedores são obrigados a proteger suas informações e usá-las apenas para os fins para os quais foram contratados.</li>
            <li><strong>Obrigações Legais:</strong> Podemos divulgar suas informações se exigido por lei ou em resposta a um processo legal válido (ex: ordem judicial).</li>
          </ul>
          <p>Suas Cápsulas são privadas por padrão. Não acessamos ou compartilhamos o conteúdo de suas Cápsulas com terceiros, exceto quando estritamente necessário para manter o serviço ou por força de lei.</p>
        </section>

        <section>
          <h2>5. Segurança dos Dados</h2>
          <p>Implementamos medidas de segurança técnicas e administrativas razoáveis para proteger suas informações pessoais contra acesso não autorizado, uso indevido, divulgação, alteração ou destruição. No entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro. Portanto, não podemos garantir sua segurança absoluta.</p>
        </section>

        <section>
          <h2>6. Retenção de Dados</h2>
          <p>Retemos suas informações pessoais pelo tempo necessário para fornecer o Serviço, cumprir nossas obrigações legais, resolver disputas e fazer cumprir nossos acordos.</p>
        </section>

        <section>
          <h2>7. Seus Direitos</h2>
          <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Para exercer esses direitos, entre em contato conosco pelo e-mail fornecido abaixo.</p>
        </section>

        <section>
          <h2>8. Privacidade de Crianças</h2>
          <p>O Cápsula não se destina a crianças menores de 13 anos. Não coletamos intencionalmente informações de identificação pessoal de crianças menores de 13 anos. Se você é pai ou responsável e souber que seu filho nos forneceu informações pessoais, entre em contato conosco para que possamos tomar as medidas necessárias para remover essas informações.</p>
        </section>

        <section>
          <h2>9. Alterações nesta Política</h2>
          <p>Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando a data de "Última atualização". Aconselhamos que você revise esta Política de Privacidade periodicamente para quaisquer alterações.</p>
        </section>

        <section>
          <h2>10. Contato</h2>
          <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através do e-mail: capsula@capsula.com.br . </p>
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
        p, ul {
          margin-bottom: 1rem;
        }
        ul {
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicyPage;