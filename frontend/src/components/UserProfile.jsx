// src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import Navbar from '../components/Navbar'; // Mantenha a importação da Navbar!

import './UserProfile.css'; // Mantenha a importação do CSS

const UserProfile = () => {
    const { user: authUser, loading: authLoading, logout, updateProfile, updatePassword, deleteAccount } = useAuth();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [passwordFields, setPasswordFields] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
    });
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading) {
            if (authUser) {
                setUser(authUser);
                setEditName(authUser.name);
                setEditEmail(authUser.email);
            } else {
                console.warn('Usuário não autenticado no UserProfile. Redirecionando para login.');
                navigate('/login');
            }
            setLoading(false); // Mova para fora dos ifs para garantir que loading seja false após a checagem
        }
    }, [authUser, authLoading, navigate]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const result = await updateProfile(editName, editEmail);
            if (result.success) {
                setUser(result.user);
                alert(result.message);
            } else {
                alert('Erro ao atualizar perfil: ' + result.message);
            }
        } catch (err) {
            alert('Erro ao atualizar perfil: ' + (err.response?.data?.message || err.message));
            console.error(err);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            const result = await updatePassword(passwordFields.current_password, passwordFields.new_password, passwordFields.confirm_new_password);
            if (result.success) {
                alert(result.message);
                setPasswordFields({ current_password: '', new_password: '', confirm_new_password: '' });
            } else {
                alert('Erro ao alterar senha: ' + result.message);
            }
        } catch (err) {
            alert('Erro ao alterar senha: ' + (err.response?.data?.message || err.message));
            console.error(err);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const result = await deleteAccount(deletePassword);
            if (result.success) {
                alert(result.message);
                navigate('/login');
            } else {
                alert('Erro ao excluir conta: ' + result.message);
            }
        } catch (err) {
            alert('Erro ao excluir conta: ' + (err.response?.data?.message || err.message));
            console.error(err);
        } finally {
            setShowDeleteConfirmation(false);
            setDeletePassword('');
        }
    };

    // Renderiza a Navbar e o conteúdo do carregamento/erro dentro do mesmo contexto
    if (loading) return (
        <>
            <Navbar />
            <div className="profile-page-content" style={{ textAlign: 'center', padding: '50px' }}>Carregando perfil...</div>
        </>
    );
    if (error) return (
        <>
            <Navbar />
            <div className="profile-page-content" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Erro: {error}</div>
        </>
    );
    if (!user) return (
        <>
            <Navbar />
            <div className="profile-page-content" style={{ textAlign: 'center', padding: '50px' }}>Você não está logado. Por favor, faça login para ver seu perfil.</div>
        </>
    );

    return (
        // Use um Fragmento <>...</> como wrapper, para que a Navbar e o conteúdo do perfil
        // possam ser irmãos diretos (e assim, a Navbar pode ocupar a largura total)
        <>
            <Navbar /> {/* A Navbar renderiza aqui, ela terá sua própria largura (provavelmente 100%) */}

            {/* Este é o div que conterá o conteúdo do perfil, limitado e centralizado */}
            <div className="profile-page-content"> {/* AGORA SIM, ESTA DIV VAI USAR A SUA CLASSE DE LAYOUT! */}
                <Link to="/dashboard" className="back-to-dashboard-button">
                    Voltar
                </Link>

                <h1 className="profile-header">Meu Perfil</h1>

                <section className="profile-section">
                    <h2 className="section-title">Informações do Usuário</h2>
                    <p><strong>Nome:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Membro desde:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Data indisponível'}</p>
                </section>

                <section className="profile-section">
                    <h2 className="section-title">Atualizar Perfil</h2>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Nome:</label>
                            <input
                                type="text"
                                id="name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email:</label>
                            <input
                                type="email"
                                id="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <button type="submit" className="profile-button">Salvar Alterações</button>
                    </form>
                </section>

                <section className="profile-section">
                    <h2 className="section-title">Alterar Senha</h2>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label htmlFor="current_password" className="form-label">Senha Atual:</label>
                            <input
                                type="password"
                                id="current_password"
                                value={passwordFields.current_password}
                                onChange={(e) => setPasswordFields({...passwordFields, current_password: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="new_password" className="form-label">Nova Senha:</label>
                            <input
                                type="password"
                                id="new_password"
                                value={passwordFields.new_password}
                                onChange={(e) => setPasswordFields({...passwordFields, new_password: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm_new_password" className="form-label">Confirmar Nova Senha:</label>
                            <input
                                type="password"
                                id="confirm_new_password"
                                value={passwordFields.confirm_new_password}
                                onChange={(e) => setPasswordFields({...passwordFields, confirm_new_password: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        <button type="submit" className="profile-button">Alterar Senha</button>
                    </form>
                </section>

                <section>
                    <h2 className="section-title">Excluir Conta</h2>
                    <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="profile-button delete-button"
                    >
                        Excluir Minha Conta
                    </button>

                    {showDeleteConfirmation && (
                        <div className="delete-confirmation">
                            <h3>Confirmação de Exclusão</h3>
                            <p>Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados (cápsulas, mídias) serão permanentemente apagados.</p>
                            <div className="form-group">
                                <label htmlFor="delete_password" className="form-label">Digite sua senha para confirmar:</label>
                                <input
                                    type="password"
                                    id="delete_password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="confirmation-button-group">
                                <button
                                    onClick={handleDeleteAccount}
                                    className="profile-button delete-button"
                                >
                                    Confirmar Exclusão
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className="profile-button"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default UserProfile;