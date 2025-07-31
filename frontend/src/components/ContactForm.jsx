// /home/Wilder/capsula/frontend/src/components/ContactForm.jsx

import React, { useState } from 'react';

const ContactForm = ({ onMessageSent }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState(''); // Para feedback ao usuário (enviando, sucesso, erro)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita o recarregamento da página
        setStatus('Enviando...');

        try {
            const response = await fetch('/api/send-contact-email', { // Endereço do seu endpoint no backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Mensagem enviada com sucesso! Em breve entraremos em contato.');
                setFormData({ name: '', email: '', subject: '', message: '' }); // Limpa o formulário
                if (onMessageSent) {
                    onMessageSent(); // Chama a função se houver uma para notificar o pai
                }
            } else {
                setStatus(`Erro ao enviar mensagem: ${data.message || 'Tente novamente mais tarde.'}`);
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setStatus('Erro de conexão. Verifique sua internet e tente novamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
            {status && (
                <div style={{ 
                    padding: '10px', 
                    borderRadius: '5px', 
                    textAlign: 'center', 
                    backgroundColor: status.includes('sucesso') ? '#d4edda' : '#f8d7da', 
                    color: status.includes('sucesso') ? '#155724' : '#721c24',
                    border: status.includes('sucesso') ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
                }}>
                    {status}
                </div>
            )}

            <input
                type="text"
                name="name"
                placeholder="Seu Nome"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
            />
            <input
                type="email"
                name="email"
                placeholder="Seu Melhor E-mail"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
            />
            <input
                type="text"
                name="subject"
                placeholder="Assunto"
                value={formData.subject}
                onChange={handleChange}
                required
                style={inputStyle}
            />
            <textarea
                name="message"
                placeholder="Sua Mensagem"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6" // Altura inicial do campo de texto
                style={{ ...inputStyle, resize: 'vertical' }} // Permite redimensionar verticalmente
            ></textarea>
            <button type="submit" style={buttonStyle}>
                Enviar Mensagem
            </button>
        </form>
    );
};

// Estilos básicos para os campos de input e botão
const inputStyle = {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '1em',
    width: '100%',
    boxSizing: 'border-box' // Para padding e border serem incluídos na largura total
};

const buttonStyle = {
    padding: '12px 20px',
    backgroundColor: '#3b82f6', // Seu azul
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    alignSelf: 'center' // Centraliza o botão se o container for flex
};

export default ContactForm;