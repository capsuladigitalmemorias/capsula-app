// frontend/src/pages/FaqPage.jsx

import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/FaqPage.css'; // Crie este arquivo CSS para estilização

const FaqPage = () => {
    return (
        <div className="faq-page-container">
            <Navbar />
            <main className="faq-content">
                <h1>Dúvidas Frequentes (FAQ)</h1>

                {/* Seção: 1. Sobre o Capsula */}
                <section className="faq-section">
                    <h2>1. Sobre o Capsula</h2>
                    <div className="faq-item">
                        <h3>O que é o Capsula?</h3>
                        <p>O Capsula é a sua plataforma pessoal para "Viver Intensamente e Preservar Para Sempre" suas memórias mais valiosas. Permite que você crie cápsulas digitais de momentos, sentimentos e experiências importantes, armazenando textos, fotos e áudios em um só lugar.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Qual é o objetivo do Capsula?</h3>
                        <p>Nosso objetivo é ajudar você a eternizar suas lembranças, organizá-las de forma significativa e revisitá-las a qualquer momento, garantindo que o tempo não apague os detalhes mais preciosos da sua vida.</p>
                    </div>
                    <div className="faq-item">
                    <h3>Como posso acessar o Capsula?</h3>
                        <p>Pelo seu computador ou smartphone, você pode acessar o Capsula diretamente pelo navegador através da nossa URL <a href="https://www.capsuladigital.com.br" target="_blank" rel="noopener noreferrer"><b>https://www.capsuladigital.com.br</b></a>.</p>
                        <p>Para uma experiência ainda mais integrada e rápida, você pode "instalar" o Capsula diretamente no seu computador ou smartphone, transformando-o em um aplicativo. Para saber como fazer isso, acesse nossa página de <a href="/instalar" target="_blank" rel="noopener noreferrer">Instalação</a>.</p>
                    </div>
                </section>

                {/* Seção: 2. Primeiros Passos */}
                <section className="faq-section">
                    <h2>2. Primeiros Passos</h2>
                    <div className="faq-item">
                        <h3>Como crio minha primeira cápsula?</h3>
                        <p>Após fazer login, clique no botão "Criar Cápsula" no painel principal. Você será guiado por um formulário para adicionar título, descrição, data, localização e mídias.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Que tipo de conteúdo posso adicionar a uma cápsula?</h3>
                        <p>Você pode adicionar textos (descrições, reflexões), imagens (fotos) e arquivos de áudio.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Como faço para enviar fotos/áudios para minhas cápsulas?</h3>
                        <p>Dentro da criação/edição de uma cápsula, haverá uma seção para upload de mídias. Basta selecionar os arquivos do seu dispositivo.</p>
                    </div>
                </section>

                {/* Seção: 3. Organização e Personalização */}
                <section className="faq-section">
                    <h2>3. Organização e Personalização</h2>
                    <div className="faq-item">
                        <h3>O que são "Moods" e "Tags" e como os utilizo?</h3>
                        <p><b>Moods</b> (Humores) permitem que você categorize suas cápsulas pelo sentimento predominante do momento (ex: "Alegria", "Gratidão", "Aventura"). <b>Tags</b> (Etiquetas) são palavras-chave livres que ajudam a categorizar suas cápsulas por temas específicos (ex: "Viagem", "Aniversário", "Família", "Trabalho"). Ambos facilitam a organização e a busca por memórias futuras.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Posso organizar minhas cápsulas por data ou local?</h3>
                        <p>Sim! Cada cápsula é criada com uma data e pode incluir uma localização. Você poderá pesquisar e filtrar suas cápsulas com base nessas informações para encontrar exatamente o que procura.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Existe um limite para o número de cápsulas ou arquivos que posso armazenar?</h3>
                        <p>
                            Atualmente, não há limite para o número de cápsulas criadas. Para mídias, cada cápsula pode armazenar 01 imagem e 01 áudio de até 30 segundos, além de um texto sem limite de caracteres.
                        </p>
                    </div>
                </section>

                {/* Seção: 4. Privacidade e Segurança */}
                <section className="faq-section">
                    <h2>4. Privacidade e Segurança</h2>
                    <div className="faq-item">
                        <h3>Minhas cápsulas são privadas por padrão?</h3>
                        <p>Sim, todas as suas cápsulas são privadas por padrão. Apenas você pode visualizá-las e acessá-las após o login.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Posso compartilhar minhas cápsulas com outras pessoas?</h3>
                        <p>
                           Atualmente, as cápsulas são apenas para seu uso pessoal, garantindo total privacidade às suas memórias.
                        </p>
                    </div>
                    <div className="faq-item">
                        <h3>Como o Capsula protege minhas memórias e dados?</h3>
                        <p>Utilizamos tecnologias de criptografia de ponta para proteger seus dados e garantir a segurança das suas memórias. Suas informações são armazenadas em servidores seguros, e tomamos todas as precauções para garantir a confidencialidade e integridade dos seus dados.</p>
                    </div>
                </section>

                {/* Seção: 5. Minha Conta */}
                <section className="faq-section">
                    <h2>5. Minha Conta</h2>
                    <div className="faq-item">
                        <h3>Como posso redefinir minha senha se a esquecer?</h3>
                        <p>Na tela de login, clique em "Esqueci minha senha" e siga as instruções para receber um link de redefinição no seu e-mail cadastrado.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Posso alterar meu e-mail ou nome de usuário?</h3>
                        <p>Sim, você pode alterar seu nome de usuário e endereço de e-mail a qualquer momento acessando as configurações do seu perfil após o login.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Como faço para excluir minha conta?</h3>
                        <p>Você pode excluir sua conta acessando as configurações do seu perfil. Tenha em mente que, ao fazer isso, todas as suas cápsulas e mídias serão permanentemente apagadas e não poderão ser recuperadas.</p>
                    </div>
                    <div className="faq-item">
                        <h3>Tenho um feedback ou problema técnico, como entro em contato?</h3>
                        <p>Você pode entrar em contato conosco a qualquer momento através do nosso <a href="/contato" target="_blank" rel="noopener noreferrer">Formulário de Contato</a>. Estamos sempre prontos para ajudar!</p>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default FaqPage;