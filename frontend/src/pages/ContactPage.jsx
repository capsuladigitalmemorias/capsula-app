// /home/Wilder/capsula/frontend/src/pages/ContactPage.jsx

import React from 'react';
import Navbar from '../components/Navbar';
import ContactForm from '../components/ContactForm'; // Importa o novo componente do formulário

function ContactPage() {
    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div style={{
                maxWidth: '1200px',
                margin: '0px auto',
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                textAlign: 'center',
                boxSizing: 'border-box',
                padding: '32px'
            }}>
                <h1 style={{
                    fontSize: '2.5em',
                    color: '#3b82f6',
                    marginBottom: '30px',
                    fontWeight: 'bold'
                }}>Fale Conosco</h1>

                <p style={{ // Parágrafo introdutório, antes do formulário
                    fontSize: '1.1em',
                    lineHeight: '1.7',
                    marginBottom: '30px', // Mais espaço antes do formulário
                    color: '#555'
                }}>
                    Por favor, preencha o formulário abaixo para entrar em contato conosco. Responderemos o mais breve possível!
                </p>

                {/* Renderiza o componente do formulário aqui */}
                <ContactForm />

            </div>
        </div>
    );
}

export default ContactPage;