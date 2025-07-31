// frontend/src/pages/TimelinePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CapsuleModal from '../components/CapsuleModal';
import TimelineCapsuleItem from '../components/TimelineCapsuleItem'; // Importa o componente da cápsula
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Helper para obter o nome do mês (ex: "Janeiro", "Fevereiro")
const getMonthName = (monthNumber) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[monthNumber - 1]; // monthNumber é 1-12
};

// Função para agrupar e ordenar cápsulas por ano e mês
const groupCapsulesByYearAndMonth = (caps) => {
  const grouped = {}; // { year: { monthNum: { display: "MMMM YYYY", capsules: [...] } } }

  caps.forEach(capsule => {
    const date = new Date(capsule.created_at);
    const year = date.getFullYear();
    const monthNum = date.getMonth() + 1; // 1-12
    const monthNameDisplay = format(date, 'MMMM yyyy', { locale: ptBR }); // Ex: "Novembro 2023"

    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][monthNum]) { // Agrupa pelo número do mês para ordenação correta
      grouped[year][monthNum] = {
        display: monthNameDisplay, // String formatada para exibição
        capsules: []
      };
    }
    grouped[year][monthNum].capsules.push(capsule);
  });

  // Ordena as cápsulas dentro de cada mês por data de criação (mais recente primeiro)
  Object.keys(grouped).forEach(year => {
    Object.keys(grouped[year]).forEach(monthNum => {
      grouped[year][monthNum].capsules.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
  });

  return grouped;
};

const TimelinePage = () => {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedYears, setExpandedYears] = useState(new Set());
  // Novo estado para controlar a expansão dos meses
  const [expandedMonths, setExpandedMonths] = useState(new Set()); // Formato: "YYYY-MM"

  useEffect(() => {
    const fetchCapsules = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/capsules');
        setCapsules(response.data);
        console.log('Cápsulas para Timeline:', response.data);

        // Expande o ano e o mês mais recentes após o carregamento
        if (response.data.length > 0) {
          const latestCapsuleDate = new Date(
            Math.max(...response.data.map(e => new Date(e.created_at)))
          );
          const latestYear = latestCapsuleDate.getFullYear().toString();
          const latestMonthNum = (latestCapsuleDate.getMonth() + 1).toString(); // Mês como string

          setExpandedYears(new Set([latestYear]));
          setExpandedMonths(new Set([`${latestYear}-${latestMonthNum}`])); // Expande o mês mais recente
        }

      } catch (err) {
        console.error('Erro ao buscar cápsulas para timeline:', err);
        let errorMessage = 'Erro desconhecido ao carregar suas cápsulas. ��';
        if (err.response) {
          errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Sem resposta do servidor. Verifique sua conexão. ��';
        } else {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, []);

  const groupedCapsules = groupCapsulesByYearAndMonth(capsules);
  const years = Object.keys(groupedCapsules).sort((a, b) => b - a);

  const toggleYear = (yearToToggle) => {
    setExpandedYears(prev => {
      const newExpandedYears = new Set(prev);
      if (newExpandedYears.has(yearToToggle)) {
        newExpandedYears.delete(yearToToggle);
      } else {
        newExpandedYears.add(yearToToggle);
      }
      return newExpandedYears;
    });
  };

  // Nova função para alternar a expansão dos meses
  const toggleMonth = (year, monthNum) => {
    const monthKey = `${year}-${monthNum}`;
    setExpandedMonths(prev => {
      const newExpandedMonths = new Set(prev);
      if (newExpandedMonths.has(monthKey)) {
        newExpandedMonths.delete(monthKey);
      } else {
        newExpandedMonths.add(monthKey);
      }
      return newExpandedMonths;
    });
  };

  const openModal = (capsule) => {
    console.log('openModal foi chamado! Cápsula selecionada:', capsule);
    setSelectedCapsule(capsule);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log('closeModal foi chamado!');
    setIsModalOpen(false);
    setSelectedCapsule(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="loading-message">
            <p>Construindo sua linha do tempo... ⏳</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-container">
          <div className="error-message">
            <p>Não foi possível carregar sua linha do tempo. ��</p>
            <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (capsules.length === 0) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-container">
          <div className="page-header">
            <h2 className="page-title">Sua Jornada no Tempo 🕰️</h2>
          </div>
          <div className="empty-state-message">
            <p>Parece que você ainda não tem cápsulas para exibir na linha do tempo. 😟</p>
            <p>Que tal criar sua primeira memória? 🤔</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-container">
        <div className="page-header">
          <h2 className="page-title">Sua Jornada no Tempo 🕰️</h2>
        </div>

        <div className="timeline-container">
          {years.map(year => (
            <div key={year} className="timeline-year-section">
              <h3 className="timeline-year-header" onClick={() => toggleYear(year)}>
                {year} {expandedYears.has(year) ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
              </h3>

              {expandedYears.has(year) && (
                <>
                  {Object.keys(groupedCapsules[year])
                    .sort((a, b) => b - a)
                    .map(monthNum => {
                      const monthData = groupedCapsules[year][monthNum];
                      const monthKey = `${year}-${monthNum}`; // Chave única para o mês
                      const isMonthExpanded = expandedMonths.has(monthKey);

                      return (
                        <div key={monthKey} className="timeline-month-group">
                          <h4 className="timeline-month-header" onClick={() => toggleMonth(year, monthNum)}>
                            {monthData.display.charAt(0).toUpperCase() + monthData.display.slice(1)}
                            {' '} {/* Espaço entre o texto e o ícone */}
                            {isMonthExpanded ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
                          </h4>
                          {isMonthExpanded && ( // Renderiza a lista de cápsulas SOMENTE se o mês estiver expandido
                            <div className="timeline-capsules-list">
                              {monthData.capsules.map(capsule => (
                                <TimelineCapsuleItem
                                  key={capsule.id}
                                  capsule={capsule}
                                  onOpenModal={openModal}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && selectedCapsule && (
        <CapsuleModal capsule={selectedCapsule} isOpen={isModalOpen} onClose={closeModal} />
      )}

      {/* ESTILOS GERAIS DA PÁGINA (TimelinePage.jsx) */}
      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .main-content-wrapper,
        .main-container {
          flex-grow: 1;
          padding-top: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          margin-bottom: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.5rem;
          margin-top: 0;
        }

        .page-title {
          color: #2d3748;
          margin: 0;
          font-size: 1.3rem;
          text-align: center;
        }

        .loading-message, .error-message, .empty-state-message {
            text-align: center;
            margin-top: 4rem;
            padding: 1.5rem;
            background-color: #f0f4f8;
            border-radius: 0.75rem;
            border: 1px solid #d9e2ec;
            color: #4a5568;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        .error-message {
            background-color: #ffebeb;
            border-color: #ffcccc;
            color: #e53e3e;
        }

        /* Estilos da Linha do Tempo (Desktop-First) */
        .timeline-container {
          position: relative;
          padding: 20px 0;
          width: 1200px; /* Largura fixa para desktop */
          max-width: 1200px;
          margin: 0 auto;
        }

        .timeline-container::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
          transform: translateX(-50%);
        }

        .timeline-year-section {
          margin-bottom: 40px;
        }

        .timeline-year-header {
          text-align: center;
          font-size: 2.2rem;
          color: #4299e1;
          margin: 0 auto 30px;
          padding: 10px 20px;
          background: #e6f1fa;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }

        .timeline-year-header:hover {
            background: #d8edf7;
        }

        .chevron-icon {
            font-size: 1.5rem;
            transition: transform 0.2s ease;
            /* Adicione estilos para centralizar o ícone no header */
            display: inline-block; /* Garante que ele possa ser alinhado */
            vertical-align: middle; /* Alinha verticalmente com o texto */
            margin-left: 5px; /* Espaço entre o texto e o ícone */
        }

        .timeline-month-group {
          margin-bottom: 20px;
          position: relative;
        }

        .timeline-month-header {
          text-align: center;
          font-size: 1.4rem;
          color: #2b6cb0;
          margin: 20px auto;
          padding: 5px 15px;
          background: #f7fafc;
          border: 1px solid #ebf8ff;
          border-radius: 5px;
          display: inline-flex; /* Alterado para inline-flex para alinhar o ícone */
          align-items: center; /* Alinha o texto e o ícone verticalmente */
          gap: 5px; /* Espaço entre o texto e o ícone */
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          cursor: pointer; /* Adicionado para indicar que é clicável */
          user-select: none;
          transition: background 0.2s ease; /* Transição para o hover */
        }

        .timeline-month-header:hover {
            background: #eef5fb; /* Cor de fundo no hover */
        }

        .timeline-capsules-list {
          padding-left: 20px; /* Mantém o padding para desktop */
          padding-right: 20px; /* Mantém o padding para desktop */
        }

        /* Responsividade para mobile (até 768px de largura) */
        @media (max-width: 768px) {
          .main-content-wrapper,
          .main-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }

          .timeline-container {
            width: 100%;
            max-width: 100%;
            margin: 0;
          }

          .timeline-container::before {
            left: 20px;
            transform: translateX(0);
          }

          .timeline-year-header, .timeline-month-header {
            left: 0;
            transform: translateX(0);
            margin-left: 20px;
            text-align: left;
            font-size: 1.8rem; /* Ajustado para year-header */
            /* Para month-header no mobile, pode querer um tamanho menor */
            &.timeline-month-header {
                font-size: 1.4rem; /* Mantém o tamanho original para o mês */
            }
          }

          .timeline-capsules-list {
            padding-left: 0; /* Para mobile, remove o padding */
            padding-right: 0; /* Para mobile, remove o padding */
          }
        }
      `}</style>
    </div>
  );
};

export default TimelinePage;