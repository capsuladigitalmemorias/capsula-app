// frontend/src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar'; // Importe a Navbar para manter o layout consistente

// Importações e registro do Chart.js
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, ChartTitle);

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('moods'); // 'moods' ou 'tags'

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/analytics');
        setAnalyticsData(response.data);
        console.log('Dados de Analytics recebidos:', response.data);
      } catch (err) {
        console.error('Erro ao buscar dados de analytics:', err);
        let errorMessage = 'Erro desconhecido ao carregar analytics.';
        if (err.response) {
          errorMessage = err.response.data?.message || `Erro HTTP: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
        } else {
          errorMessage = err.message;
        }
        setError(`Erro: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const formatPercentage = (value) => {
    return value.toFixed(1).replace('.', ',') + '%';
  };

  // Função auxiliar para gerar cores vibrantes para os gráficos
  const generateVibrantColor = (index, total) => {
    const hue = (index * (360 / total)) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  const generateVibrantColors = (count) => {
      return Array.from({ length: count }, (_, i) => generateVibrantColor(i, count));
  };


  // Funções para calcular insights específicos
  const getMostFrequentMood = (distribution) => {
    if (!distribution || distribution.length === 0) return 'N/A';
    const sorted = [...distribution].sort((a, b) => b.count - a.count);
    return `${sorted[0].emoji} ${sorted[0].mood_name} (${sorted[0].count} cápsula(s))`;
  };

  const getMostFrequentTag = (distribution) => {
    if (!distribution || distribution.length === 0) return 'N/A';
    const sorted = [...distribution].sort((a, b) => b.count - a.count);
    return `${sorted[0].tag_name} (${sorted[0].count} cápsula(s))`;
  };

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="loading-message">
            <p>Carregando seus insights...</p>
            {/* Você pode adicionar um spinner ou loader aqui */}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="error-message">
            <p>Oops! Algo deu errado ao carregar os dados. 😓</p>
            <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.overall_stats.total_capsules === 0) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content-wrapper">
          <div className="page-header">
            <h2 className="page-title">Analytics Avançados ✨</h2>
          </div>
          <div className="empty-state-message">
            <p>Ainda não há cápsulas suficientes para gerar insights. 😔</p>
            <p>Crie algumas memórias para começar a sua jornada de autoconhecimento! 😊</p>
          </div>
        </div>
      </div>
    );
  }

  const { overall_stats, mood_distribution, tag_distribution, temporal_evolution, tag_correlations } = analyticsData;

  // Filtrar correlações para mostrar apenas as com co_occurrence_count >= 2 para serem "significativas"
  const significantTagCorrelations = tag_correlations.filter(corr => corr.co_occurrence_count >= 2);

  // --- Dados para Gráficos ---

  // Dados para o Gráfico de Pizza de Humores
  const moodPieChartData = {
    labels: mood_distribution.map(item => `${item.emoji} ${item.mood_name}`),
    datasets: [{
      data: mood_distribution.map(item => item.count),
      backgroundColor: generateVibrantColors(mood_distribution.length),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };
  const moodPieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 20,
          padding: 10,
          usePointStyle: true, // AJUSTADO: Legendas redondas para gráficos de pizza
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `${context.parsed} (${formatPercentage((context.parsed / overall_stats.total_capsules) * 100)})`;
            }
            return label;
          }
        }
      }
    }
  };

  // Dados para o Gráfico de Pizza de Tags
  const tagPieChartData = {
    labels: tag_distribution.map(item => item.tag_name),
    datasets: [{
      data: tag_distribution.map(item => item.count),
      backgroundColor: generateVibrantColors(tag_distribution.length),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };
  const tagPieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 20,
          padding: 10,
          usePointStyle: true, // AJUSTADO: Legendas redondas para gráficos de pizza
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `${context.parsed} (${formatPercentage((context.parsed / overall_stats.total_capsules) * 100)})`;
            }
            return label;
          }
        }
      }
    }
  };


  // Dados para o Gráfico de Linha de Cápsulas por Mês (para ambas as abas)
  const capsulesTemporalLineChartData = {
    labels: temporal_evolution.labels,
    datasets: [{
      label: 'Cápsulas Criadas',
      data: temporal_evolution.capsules_per_month,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      pointStyle: 'circle',
      pointRadius: 5,
      pointHoverRadius: 8,
    }],
  };
  const commonLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top', // Mantido 'top' para este gráfico, pois a legenda é pequena
        labels: {
            usePointStyle: true, // AJUSTADO: Legendas redondas para este gráfico
            padding: 10, // Espaçamento entre os itens da legenda
        }
      },
      title: {
        display: true,
        text: 'Cápsulas Criadas por Mês',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Cápsulas',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Mês',
        },
      },
    },
    layout: { // Adicionado padding para evitar sobreposição
        padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
        }
    }
  };

  // Dados para o Gráfico de Linha de Humores por Mês
  const moodsTemporalLineChartData = {
    labels: temporal_evolution.labels,
    datasets: Object.keys(temporal_evolution.moods_per_month).map((moodName, index) => ({
      label: moodName,
      data: temporal_evolution.moods_per_month[moodName],
      fill: false,
      borderColor: generateVibrantColor(index, Object.keys(temporal_evolution.moods_per_month).length),
      tension: 0.1,
      pointStyle: 'circle',
      pointRadius: 4,
      pointHoverRadius: 7,
    })),
  };
  const moodsLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
            usePointStyle: true, // Legendas redondas
            padding: 20, // Espaçamento entre os itens da legenda
            boxWidth: 10 // Pode ajudar a quebrar em várias linhas se necessário
        }
      },
      title: {
        display: true,
        text: 'Evolução de Humores por Mês',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ocorrências',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Mês',
        },
      },
    },
    layout: {
        padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 70 // Mantido em 70 como você confirmou
        }
    }
  };

  // Dados para o Gráfico de Linha de Tags por Mês
  const tagsTemporalLineChartData = {
    labels: temporal_evolution.labels,
    datasets: Object.keys(temporal_evolution.tags_per_month).map((tagName, index) => ({
      label: tagName,
      data: temporal_evolution.tags_per_month[tagName],
      fill: false,
      borderColor: generateVibrantColor(index, Object.keys(temporal_evolution.tags_per_month).length),
      tension: 0.1,
      pointStyle: 'circle',
      pointRadius: 4,
      pointHoverRadius: 7,
    })),
  };
  const tagsLineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
            usePointStyle: true, // Legendas redondas
            padding: 20, // Espaçamento entre os itens da legenda
            boxWidth: 10 // Pode ajudar a quebrar em várias linhas se necessário
        }
      },
      title: {
        display: true,
        text: 'Evolução de Tags por Mês',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ocorrências',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Mês',
        },
      },
    },
    layout: {
        padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 70 // Mantido em 70 para consistência
        }
    }
  };


  return (
    <div className="app-container">
      <Navbar />

      <div className="main-content-wrapper">
        <div className="page-header">
          <h2 className="page-title">Analytics Avançados ✨</h2>
        </div>

        {/* Abas de navegação */}
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'moods' ? 'active' : ''}`}
            onClick={() => setActiveTab('moods')}
          >
            Humores
          </button>
          <button
            className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            Tags
          </button>
        </div>

        {/* Conteúdo das abas */}
        <div className="tab-content-area">
          {activeTab === 'moods' && (
            <div className="moods-analytics-content">
              <div className="analytics-section">
                <h3>Visão Geral dos Humores</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Total de Cápsulas</h4>
                    <p>{overall_stats.total_capsules}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Humores Únicos Registrados</h4>
                    <p>{overall_stats.unique_moods_used} de {overall_stats.total_available_moods}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Humor Mais Frequente</h4>
                    <p>{getMostFrequentMood(mood_distribution)}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Diversidade Emocional</h4>
                    <p>{overall_stats.total_available_moods > 0 ? formatPercentage(overall_stats.unique_moods_used / overall_stats.total_available_moods * 100) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>Distribuição de Humores</h3>
                <p className="insight">Descubra os humores que mais te acompanharam em suas memórias e seus percentuais.</p>
                {/* Gráfico de Pizza AQUI */}
                <div className="chart-container pie-chart-container">
                    <Pie data={moodPieChartData} options={moodPieChartOptions} />
                </div>
                <div className="distribution-list">
                  {mood_distribution.length > 0 ? (
                    mood_distribution.map((item, index) => (
                      <div key={index} className="distribution-item">
                        <span>{item.emoji} {item.mood_name}</span>
                        <span>{item.count} cápsula(s) <span className="percentage">({formatPercentage(item.percentage)})</span></span>
                      </div>
                    ))
                  ) : (
                    <p>Nenhum humor registrado.</p>
                  )}
                </div>
              </div>

              <div className="analytics-section">
                <h3>Evolução Temporal (Últimos 6 Meses)</h3>
                <p className="insight">Entenda como seus registros evoluíram ao longo do tempo. Observe tendências e períodos específicos.</p>

                <h4>Cápsulas por Mês:</h4>
                <ul className="temporal-list">
                  {temporal_evolution.labels.map((label, index) => (
                    <li key={label}>
                      {label}: <strong>{temporal_evolution.capsules_per_month[index]}</strong> cápsula(s)
                    </li>
                  ))}
                </ul>

                {/* Gráfico de Linha de Cápsulas por Mês AQUI */}
                <div className="chart-container">
                    <Line data={capsulesTemporalLineChartData} options={commonLineChartOptions} />
                </div>

                <h4>Evolução dos Humores:</h4>
                <p className="insight">Veja como cada humor se manifestou ao longo dos últimos 6 meses. (Gráfico de Linha)</p>
                {/* Gráfico de Linha de Humores por Mês AQUI */}
                {Object.keys(temporal_evolution.moods_per_month).length > 0 ? (
                    <div className="chart-container">
                        <Line data={moodsTemporalLineChartData} options={moodsLineChartOptions} />
                    </div>
                ) : (
                    <p>Nenhum humor registrado nos últimos 6 meses para mostrar evolução.</p>
                )}
              </div>

              <div className="insights-card">
                <h3><span className="icon">💡</span> Insights Psicológicos</h3>
                <p>Com base em seus registros:</p>
                <ul>
                  <li><span className="list-icon">✅</span> Sua **diversidade emocional** é de **{overall_stats.total_available_moods > 0 ? formatPercentage(overall_stats.unique_moods_used / overall_stats.total_available_moods * 100) : 'N/A'}**.</li>
                  <li><span className="list-icon">⭐</span> O humor **{mood_distribution.length > 0 ? mood_distribution[0].mood_name : 'N/A'}** é o mais presente.</li>
                  <li><span className="list-icon">📈</span> Os gráficos de evolução temporal permitem que você visualize picos e vales em seus padrões emocionais ao longo do tempo. Analise se há padrões ligados a eventos específicos da sua vida.</li>
                </ul>
                <p className="insight-footer"><i>Estas observações são iniciais e visam encorajar a reflexão sobre seus padrões emocionais.</i></p>
              </div>

              <div className="insights-card">
                <h3><span className="icon">🌱</span> Dicas para Autoconhecimento</h3>
                <ul>
                  <li><span className="list-icon">🧘‍♀️</span> Se notar um humor recorrente, tente práticas de **mindfulness** para observar essa emoção sem julgamento.</li>
                  <li><span className="list-icon">✍️</span> Experimente registrar o motivo por trás de cada humor em suas cápsulas. Isso pode revelar gatilhos e padrões.</li>
                  <li><span className="list-icon">🌟</span> Para aumentar a **diversidade emocional**, proponha-se a ter experiências novas e desafiadoras que possam provocar diferentes sentimentos.</li>
                  <li><span className="list-icon">💬</span> Compartilhe suas percepções com um amigo de confiança ou profissional para um olhar externo.</li>
                </ul>
                <p className="insight-footer"><i>Lembre-se: o autoconhecimento é uma jornada contínua!</i></p>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="tags-analytics-content">
              <div className="analytics-section">
                <h3>Visão Geral das Tags</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Total de Cápsulas</h4>
                    <p>{overall_stats.total_capsules}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Tags Únicas Registradas</h4>
                    <p>{overall_stats.unique_tags_used} de {overall_stats.total_available_tags}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Tag Mais Utilizada</h4>
                    <p>{getMostFrequentTag(tag_distribution)}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Diversidade Temática</h4>
                    <p>{overall_stats.total_available_tags > 0 ? formatPercentage(overall_stats.unique_tags_used / overall_stats.total_available_tags * 100) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>Distribuição de Tags</h3>
                <p className="insight">Veja quais temas são mais recorrentes em suas cápsulas e qual a frequência de cada um.</p>
                {/* Gráfico de Pizza AQUI */}
                <div className="chart-container pie-chart-container">
                    <Pie data={tagPieChartData} options={tagPieChartOptions} />
                </div>
                <div className="distribution-list">
                  {tag_distribution.length > 0 ? (
                    tag_distribution.map((item, index) => (
                      <div key={index} className="distribution-item">
                        <span>{item.tag_name}</span>
                        <span>{item.count} cápsula(s) <span className="percentage">({formatPercentage(item.percentage)})</span></span>
                      </div>
                    ))
                  ) : (
                    <p>Nenhuma tag registrada.</p>
                  )}
                </div>
              </div>

              <div className="analytics-section">
                <h3>Correlações entre Tags</h3>
                <p className="insight">Descubra quais temas frequentemente aparecem juntos em suas memórias, revelando padrões e conexões interessantes.</p>
                {significantTagCorrelations.length > 0 ? (
                  <ul className="correlation-list">
                    {significantTagCorrelations.map((corr, index) => (
                      <li key={index}>
                        <strong>{corr.tag1}</strong> e <strong>{corr.tag2}</strong> apareceram juntas em <strong>{corr.co_occurrence_count}</strong> cápsula(s).
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Não há correlações significativas de tags (mínimo de duas tags por cápsula com a mesma correlação).</p>
                )}
              </div>

              <div className="analytics-section">
                <h3>Evolução Temporal (Últimos 6 Meses)</h3>
                <p className="insight">Entenda como o uso das suas tags e categorias evoluiu ao longo do tempo. Identifique períodos de maior interesse em certos temas.</p>

                <h4>Cápsulas por Mês:</h4>
                <ul className="temporal-list">
                  {temporal_evolution.labels.map((label, index) => (
                    <li key={label}>
                      {label}: <strong>{temporal_evolution.capsules_per_month[index]}</strong> cápsula(s)
                    </li>
                  ))}
                </ul>
                {/* Gráfico de Linha de Cápsulas por Mês AQUI */}
                <div className="chart-container">
                    <Line data={capsulesTemporalLineChartData} options={commonLineChartOptions} />
                </div>

                <h4>Evolução das Tags:</h4>
                <p className="insight">Veja como cada tag se manifestou ao longo dos últimos 6 meses. (Gráfico de Linha)</p>
                {/* Gráfico de Linha de Tags por Mês AQUI */}
                {Object.keys(temporal_evolution.tags_per_month).length > 0 ? (
                    <div className="chart-container">
                        <Line data={tagsTemporalLineChartData} options={tagsLineChartOptions} />
                    </div>
                ) : (
                    <p>Nenhuma tag registrada nos últimos 6 meses para mostrar evolução.</p>
                )}
              </div>

              <div className="insights-card">
                <h3><span className="icon">🧠</span> Análise Comportamental</h3>
                <p>Com base em seus registros de tags:</p>
                <ul>
                  <li><span className="list-icon">📊</span> Você tem **{overall_stats.unique_tags_used}** tags diferentes.</li>
                  <li><span className="list-icon">🔗</span> As correlações de tags indicam temas que estão interligados em suas experiências.</li>
                  <li><span className="list-icon">📈</span> Os gráficos de evolução temporal permitem que você visualize picos de atividade em certas categorias, indicando focos em períodos específicos da sua vida.</li>
                </ul>
                <p className="insight-footer"><i>Essas análises oferecem um panorama sobre como você categoriza suas experiências.</i></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estilos específicos para esta página */}
      <style jsx>{`
        /* Estilos Gerais do Layout */
        .main-content-wrapper {
            padding-top: 1.5rem; /* Espaçamento para desktop (24px) */
            padding-left: 1rem; /* Padding horizontal para o conteúdo */
            padding-right: 1rem; /* Padding horizontal para o conteúdo */
            max-width: 1200px; /* Limite a largura para melhor legibilidade */
            margin: 0 auto; /* Centraliza o wrapper */
            margin-bottom: 2rem; /* Espaço para o final da página */
        }

        .page-header {
          display: flex;
          justify-content: flex-start; /* AJUSTADO: Alinha o título à esquerda */
          align-items: center;
          margin-bottom: 1.5rem; /* Espaçamento abaixo do título principal */
          margin-top: 0;
        }

        .page-title {
          color: #2d3748;
          margin: 0;
          font-size: 1.3rem;
          text-align: left; /* AJUSTADO: Garante alinhamento do texto à esquerda */
          /* Removido: width: 100%; */
        }

        /* Mensagens de estado (loading, error, empty) */
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


        /* Abas */
        .tabs-container {
          display: flex;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          justify-content: flex-start; /* Alinha as abas à esquerda */
        }

        .tab-button {
          background-color: #edf2f7;
          border: none;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          transition: all 0.3s ease;
          margin-right: 0.25rem; /* Espaço entre os botões */
          white-space: nowrap; /* Evita que o texto quebre */
        }

        .tab-button:hover {
          background-color: #e2e8f0;
        }

        .tab-button.active {
          background-color: #ffffff;
          border-bottom-color: #4299e1; /* Cor da linha ativa */
          color: #2b6cb0;
          box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05); /* Sombra suave para a aba ativa */
          position: relative;
          z-index: 1; /* Garante que a aba ativa fique por cima da borda */
          bottom: -2px; /* Ajusta para esconder a borda inferior do container */
        }

        .tab-content-area {
            background-color: #ffffff;
            padding: 0.5rem; /* Padding interno para o conteúdo das abas */
            border-radius: 0.75rem;
            /* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); */ /* Removendo shadow aqui, os sections já tem */
        }

        /* Seções de Analytics (Cards) */
        .analytics-section {
          background-color: #fff;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          margin-bottom: 2rem;
          border: 1px solid #e2e8f0;
          overflow: hidden; /* Garante que o conteúdo não vaze */
        }
        .analytics-section h3 {
          color: #3182ce;
          font-size: 1.5rem; /* Um pouco menor para seções internas */
          margin-top: 0;
          margin-bottom: 1rem;
          border-bottom: 2px solid #ebf8ff; /* Linha mais suave */
          padding-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }
        .analytics-section h3 .icon {
          margin-right: 0.5rem;
          font-size: 1.2em; /* Tamanho do ícone */
        }
        .analytics-section .insight {
            font-style: italic;
            color: #718096;
            margin-bottom: 1.5rem;
            line-height: 1.5;
            font-size: 0.95rem;
        }

        /* Grid de estatísticas */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .stat-card {
          background-color: #f7fafc;
          border: 1px solid #ebf8ff; /* Borda mais suave */
          border-radius: 0.5rem;
          padding: 1.5rem;
          text-align: center;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03); /* Sombra mais sutil */
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.08);
        }
        .stat-card h4 {
          color: #4a5568;
          font-size: 1rem;
          margin-top: 0;
          margin-bottom: 0.5rem;
          white-space: nowrap; /* Evita que o título quebre em duas linhas */
          overflow: hidden; /* Esconde o excesso se houver */
          text-overflow: ellipsis; /* Adiciona "..." se o texto for muito longo */
        }
        .stat-card p {
          font-size: 1.8rem; /* Um pouco menor para harmonizar */
          font-weight: bold;
          color: #3182ce;
          margin: 0;
        }

        /* Listas de distribuição e temporal */
        .distribution-list, .correlation-list {
          list-style: none;
          padding: 0;
          margin-top: 1rem;
        }
        .distribution-item, .correlation-list li {
          padding: 0.75rem 0;
          border-bottom: 1px dashed #edf2f7;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #4a5568;
          font-size: 1rem;
        }
        .distribution-item:last-child, .correlation-list li:last-child {
          border-bottom: none;
        }
        .distribution-item .percentage {
            font-weight: bold;
            color: #2b6cb0;
        }
        .correlation-list li strong {
            color: #2d3748;
        }
        
        /* Contêiner para Gráficos */
        .chart-container {
            position: relative; /* Necessário para manter o aspect ratio com maintainAspectRatio: false */
            height: 300px; /* Altura padrão para desktop (ou se não for mobile) */
            width: 100%;
            margin: 2rem 0; /* Espaçamento ao redor dos gráficos */
            display: flex; /* Para centralizar o gráfico */
            justify-content: center;
            align-items: center;
        }

        /* IMPORANTE: Garante que o canvas dentro do container use a altura total */
        .chart-container canvas {
            height: 100% !important; 
            width: 100% !important;
            max-height: 100%; /* Garante que não estoure o pai */
        }

        /* Evolução temporal */
        .temporal-data-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 2 ou 3 colunas, flexível */
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        .mood-temporal-item, .tag-temporal-item {
          background-color: #fbfdff;
          border: 1px solid #ebf8ff;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .mood-temporal-item h4, .tag-temporal-item h4 {
            font-size: 1.1rem;
            color: #2b6cb0;
            margin-top: 0;
            margin-bottom: 0.8rem;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 0.5rem;
        }
        .temporal-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .temporal-list li {
            padding: 0.3rem 0;
            color: #4a5568;
            font-size: 0.9rem;
        }

        /* Cards de Insights e Dicas */
        .insights-card {
            background-color: #e6fffa; /* Verde/Azul claro para destaque */
            border: 1px solid #b2f5ea;
            border-radius: 0.75rem;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }
        .insights-card h3 {
            color: #2c7a7b; /* Cor mais escura para o título */
            font-size: 1.6rem;
            margin-top: 0;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            border-bottom: none; /* Remove a borda inferior das sections normais */
            padding-bottom: 0;
        }
        .insights-card h3 .icon {
            font-size: 1.5em;
            margin-right: 0.75rem;
            color: #38b2ac; /* Cor vibrante para o ícone */
        }
        .insights-card ul {
            list-style: none;
            padding: 0;
            margin-bottom: 1.5rem;
        }
        .insights-card li {
            font-size: 1rem;
            color: #4a5568;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: flex-start;
        }
        .insights-card li .list-icon {
            margin-right: 0.75rem;
            color: #38b2ac; /* Cor do ícone da lista */
            font-size: 1.1em;
            line-height: 1.5; /* Alinha o ícone com o texto */
        }
        .insights-card .insight-footer {
            font-size: 0.85rem;
            color: #718096;
            text-align: right;
            border-top: 1px dashed #b2f5ea;
            padding-top: 1rem;
            margin-top: 1.5rem;
        }


        /* Responsividade */
        @media (max-width: 768px) {
            .main-content-wrapper {
                padding-top: 1rem; /* Espaçamento menor para mobile (16px) */
                padding-left: 0.75rem;
                padding-right: 0.75rem;
            }
            .page-header {
                margin-bottom: 1rem;
            }
            .page-title {
                font-size: 1.2rem;
                text-align: left; /* AJUSTADO: Garante alinhamento do texto à esquerda em mobile */
            }
            .tabs-container {
                margin-bottom: 1rem;
                overflow-x: auto; /* Permite scroll horizontal se muitos botões */
                white-space: nowrap; /* Impede quebras de linha nos botões */
                justify-content: flex-start; /* Garante que comece à esquerda */
            }
            .tab-button {
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }
            .analytics-section {
                padding: 1.25rem;
                margin-bottom: 1.5rem;
            }
            .analytics-section h3 {
                font-size: 1.3rem;
            }
            .stats-grid {
                grid-template-columns: 1fr; /* Coluna única em telas menores */
                gap: 1rem;
            }
            .stat-card h4 {
                font-size: 0.9rem;
            }
            .stat-card p {
                font-size: 1.5rem;
            }
            .distribution-item, .correlation-list li {
                font-size: 0.9rem;
            }
            .temporal-data-grid {
                grid-template-columns: 1fr; /* Uma coluna para temporal em mobile */
            }
            .insights-card {
                padding: 1.5rem;
            }
            .insights-card h3 {
                font-size: 1.4rem;
            }
            .insights-card li {
                font-size: 0.9rem;
            }
            
            /* Altura padrão do chart-container para mobile (MANTIDA EM 700px para os gráficos de linha) */
            .chart-container {
                height: 700px; 
            }

            /* NOVO: Altura específica para gráficos de pizza no mobile */
            .pie-chart-container {
                height: 250px; /* AJUSTADO: Altura mais adequada para gráficos de pizza (seu valor de 250px) */
            }
        }

        /* Estilos adicionais para o caso de ter um content-wrapper dentro do main-content-wrapper */
        /* Certifique-se de que o main-content-wrapper já tem padding horizontal */
        .content-wrapper {
            max-width: 100%; /* Garante que o content-wrapper não ultrapasse o main-content-wrapper */
            margin-left: auto; /* Centraliza */
            margin-right: auto; /* Centraliza */
            padding-left: 0; /* Remove padding local se main-content-wrapper já tem */
            padding-right: 0; /* Remove padding local se main-content-wrapper já tem */
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;