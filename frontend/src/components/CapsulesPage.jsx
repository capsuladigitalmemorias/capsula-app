import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import CapsuleModal from '../components/CapsuleModal';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FaCamera, FaVolumeUp } from 'react-icons/fa';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Ícones para colapsar/expandir

import './CapsulesPage.css'; // Mantenha o CSS geral da página

// LOG: Esta mensagem aparece assim que o arquivo é carregado pelo navegador
console.log('--- CapsulesPage.jsx foi carregado! ---');

// Componente auxiliar para resumo HTML (copiado do Dashboard.jsx)
const getHtmlSummary = (html, maxLength = 100) => {
  if (!html) return '';

  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'p', 'br', 'ul', 'ol', 'li'];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let charCount = 0;
  let resultHtml = '';
  const openTags = [];

  const traverseAndAppend = (node) => {
    if (charCount >= maxLength) {
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue || '';
      const remaining = maxLength - charCount;

      if (text.length > remaining) {
        resultHtml += text.substring(0, remaining);
        charCount = maxLength;
      } else {
        resultHtml += text;
        charCount += text.length;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (allowedTags.includes(tagName)) {
        if (tagName !== 'br') {
          resultHtml += `<${tagName}`;
          if (tagName === 'span') {
            const styleAttr = node.getAttribute('style');
            if (styleAttr) {
              resultHtml += ` style="${styleAttr}"`;
            }
          }
          resultHtml += `>`;
          openTags.push(tagName);
        } else {
          resultHtml += `<br>`;
        }

        for (let i = 0; i < node.childNodes.length; i++) {
          traverseAndAppend(node.childNodes[i]);
          if (charCount >= maxLength) break;
        }

        if (tagName !== 'br' && openTags[openTags.length - 1] === tagName) {
          resultHtml += `</${tagName}>`;
          openTags.pop();
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverseAndAppend(node.childNodes[i]);
          if (charCount >= maxLength) break;
        }
      }
    }
  };

  for (let i = 0; i < body.childNodes.length; i++) {
    traverseAndAppend(body.childNodes[i]);
    if (charCount >= maxLength) break;
  }

  if (charCount >= maxLength) {
    resultHtml += '...';
  }

  while (openTags.length > 0) {
    resultHtml += `</${openTags.pop()}>`;
  }

  return resultHtml;
};

// Função para agrupar cápsulas por ano e mês (reutilizada de TimelinePage)
const groupCapsulesByMonthAndYear = (caps) => {
  const grouped = {};
  caps.forEach(capsule => {
    const date = new Date(capsule.created_at);
    const year = date.getFullYear().toString(); // Garante que o ano é string para as chaves do Set
    const monthYear = format(date, 'MMMM yyyy', { locale: ptBR });

    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][monthYear]) {
      grouped[year][monthYear] = [];
    }
    grouped[year][monthYear].push(capsule);
  });
  return grouped;
};


const CapsulesPage = () => {
  console.log('--- Componente CapsulesPage sendo renderizado ---');

  const { user, logout } = useAuth();
  const [capsules, setCapsules] = useState([]); // A lista bruta de cápsulas da API (já filtrada)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [allMoods, setAllMoods] = useState([]);
  const [allTags, setAllTags] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    year: '',
    month: '',
    moodId: '',
    tagId: ''
  });

  // NOVOS ESTADOS PARA CONTROLE DE EXPANSÃO/COLAPSO
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Map()); // Map<year, Set<monthYear>>

  const navigate = useNavigate();

  const fetchCapsules = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.moodId) params.append('mood_id', filters.moodId);
      if (filters.tagId) params.append('tag_id', filters.tagId);

      console.log('Fazendo requisição para:', `/api/capsules?${params.toString()}`);
      const response = await api.get(`/api/capsules?${params.toString()}`);
      console.log('Resposta completa da API (Axios):', response.data);

      if (response.data && Array.isArray(response.data)) {
        setCapsules(response.data);
        console.log('Cápsulas carregadas para o estado:', response.data.length);
        console.log('Conteúdo do estado capsules:', response.data);

        // Opcional: Expandir o ano mais recente por padrão ao carregar
        if (response.data.length > 0 && !filters.year) { // Só expande se não tiver filtro de ano
            const latestYear = new Date(response.data[0].created_at).getFullYear().toString();
            setExpandedYears(new Set([latestYear]));
        } else if (filters.year) { // Se houver filtro de ano, expande o ano filtrado
            setExpandedYears(new Set([filters.year]));
        } else {
            setExpandedYears(new Set()); // Se não tiver cápsulas, colapsa tudo
        }

        // Limpa os meses expandidos ao recarregar as cápsulas
        setExpandedMonths(new Map());


      } else {
        console.error('Falha ao buscar cápsulas: Estrutura de dados inesperada (esperado um array).', response.data);
        setError('Falha ao carregar cápsulas: Estrutura de dados inválida.');
        setCapsules([]);
      }
    } catch (err) {
      console.error('Erro ao buscar cápsulas:', err);
      let errorMessage = 'Erro desconhecido ao carregar cápsulas.';
      if (err.response) {
          errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
          if (err.response.status === 401) { logout(); }
      } else if (err.request) { errorMessage = 'Sem resposta do servidor. Verifique sua conexão.'; } else { errorMessage = err.message; }
      setError(`Erro ao carregar cápsulas: ${errorMessage}`);
      setCapsules([]);
    } finally {
      setLoading(false);
      console.log('Estado final - loading:', false, 'current error state:', error);
    }
  }, [filters, logout]);

  useEffect(() => {
    const fetchMoodsAndTags = async () => {
      try {
        const moodsResponse = await api.get('/api/moods');
        setAllMoods(moodsResponse.data.moods || moodsResponse.data || []);
        const tagsResponse = await api.get('/api/tags');
        setAllTags(tagsResponse.data.tags || tagsResponse.data || []);
      } catch (err) {
        console.error('Erro ao carregar humores/tags para filtros:', err);
        let errorMessage = 'Erro desconhecido ao carregar filtros.';
        if (err.response) {
            errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
            if (err.response.status === 401) { logout(); }
        } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
        setError(`Erro ao carregar filtros: ${errorMessage}`);
      }
    };
    fetchMoodsAndTags();
  }, [logout]);

  useEffect(() => {
    console.log('--- useEffect acionado, chamando fetchCapsules ---');
    fetchCapsules();
  }, [filters, fetchCapsules]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Ao mudar um filtro, colapsa tudo para uma visualização limpa
    setExpandedYears(new Set());
    setExpandedMonths(new Map());
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      year: '',
      month: '',
      moodId: '',
      tagId: ''
    });
    setExpandedYears(new Set());
    setExpandedMonths(new Map());
  };

  const handleCapsuleClick = (capsule) => {
    setSelectedCapsule(capsule);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCapsule(null);
  };

  const handleDeleteCapsule = async (capsuleId, event) => {
    event.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta cápsula? Esta ação é irreversível.')) {
      return;
    }

    try {
      await api.delete(`/api/capsules/${capsuleId}`);
      alert('Cápsula excluída com sucesso!');
      fetchCapsules(); // Recarrega as cápsulas após a exclusão
    } catch (err) {
      console.error('Erro ao excluir cápsula:', err);
      let errorMessage = 'Erro desconhecido ao excluir cápsula.';
      if (err.response) {
          errorMessage = err.response.data.message || `Erro HTTP: ${err.response.status}`;
          if (err.response.status === 401) { logout(); }
      } else if (err.request) { errorMessage = 'Sem resposta do servidor.'; } else { errorMessage = err.message; }
      alert(`Erro ao excluir cápsula: ${errorMessage}`);
    }
  };

  const handleEditCapsule = (capsuleId, event) => {
    event.stopPropagation();
    navigate(`/editar-capsula/${capsuleId}`);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString + 'Z');
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Sao_Paulo'
    });
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  const hasMediaType = (capsule, type) => {
    return capsule &&
           capsule.media_files &&
           Array.isArray(capsule.media_files) &&
           capsule.media_files.some(media => media.file_type === type);
  };

  // --- Funções de alternância para Ano e Mês ---
  const toggleYear = (yearToToggle) => {
    setExpandedYears(prev => {
      const newExpandedYears = new Set(prev);
      if (newExpandedYears.has(yearToToggle)) {
        newExpandedYears.delete(yearToToggle);
        // Ao colapsar um ano, colapsa também todos os meses desse ano
        setExpandedMonths(prevMonths => {
            const newMonths = new Map(prevMonths);
            newMonths.delete(yearToToggle);
            return newMonths;
        });
      } else {
        newExpandedYears.add(yearToToggle);
      }
      return newExpandedYears;
    });
  };

  const toggleMonth = (year, monthYearToToggle) => {
    setExpandedMonths(prev => {
      const newExpandedMonths = new Map(prev);
      const monthsInYear = newExpandedMonths.get(year) || new Set();

      if (monthsInYear.has(monthYearToToggle)) {
        monthsInYear.delete(monthYearToToggle);
      } else {
        monthsInYear.add(monthYearToToggle);
      }

      if (monthsInYear.size === 0) {
        newExpandedMonths.delete(year);
      } else {
        newExpandedMonths.set(year, monthsInYear);
      }
      return newExpandedMonths;
    });
  };
  // --- FIM das Funções de alternância ---


  // UseMemo para evitar recalcular groupedCapsules desnecessariamente
  const groupedCapsules = useMemo(() => {
    return groupCapsulesByMonthAndYear(capsules);
  }, [capsules]);

  const years = Object.keys(groupedCapsules).sort((a, b) => b - a);


  console.log('Status de renderização: loading=', loading, 'error=', error, 'capsules.length=', capsules.length);

  return (
    <div className="app-container">
      <Navbar />

      <main>
        <div className="content-wrapper page-header">
          <h1 className="page-header-title">Minhas Cápsulas ✨</h1>
          <Link to="/criar-capsula" className="action-button primary-button">
            Nova Cápsula
          </Link>
        </div>

        {/* Filtros */}
        <div className="content-wrapper">
          <div className="filters-section">
            <h3 className="filters-title">Filtros</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Buscar</label>
                <input
                  type="text"
                  name="search"
                  placeholder="Buscar por título, descrição..."
                  value={filters.search}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label>Ano</label>
                <select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os anos</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Mês</label>
                <select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os meses</option>
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Humor</label>
                <select
                  name="moodId"
                  value={filters.moodId}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos os humores</option>
                  {allMoods.map(mood => (
                    <option key={mood.id} value={mood.id}>{mood.emoji} {mood.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Tag</label>
                <select
                  name="tagId"
                  value={filters.tagId}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas as tags</option>
                  {allTags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
                <button
                  onClick={clearFilters}
                  className="clear-filters-button"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Mensagem de erro, loading, ou cápsulas */}
        <div className="content-wrapper">
            {error && (
              <div className="message-box error">
                {error}
                <button
                  onClick={fetchCapsules}
                  className="action-button primary-button"
                  style={{ marginLeft: '1rem', backgroundColor: 'var(--red-text)' }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {loading ? (
              <div className="status-message-container">
                <p className="status-message-text">Carregando cápsulas...</p>
              </div>
            ) : !error && capsules.length === 0 ? (
              <div className="status-message-container">
                <p className="status-message-text">
                  {filters.search || filters.year || filters.month || filters.moodId || filters.tagId
                    ? 'Nenhuma cápsula encontrada com os filtros aplicados.'
                    : 'Você ainda não criou nenhuma cápsula.'
                  }
                </p>
                <Link to="/criar-capsula" className="action-button primary-button">
                  Criar primeira cápsula
                </Link>
              </div>
            ) : (
              <div className="capsules-grouped-container"> {/* Novo container para agrupamento */}
                {years.map(year => (
                  <div key={year} className="year-group-section">
                    <h3 className="year-header" onClick={() => toggleYear(year)}>
                      {year} {expandedYears.has(year) ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
                    </h3>
                    {expandedYears.has(year) && (
                      <div className="months-container">
                        {Object.keys(groupedCapsules[year]).sort((a, b) => new Date(b) - new Date(a)).map(monthYear => (
                          <div key={monthYear} className="month-group-section">
                            <h4 className="month-header" onClick={() => toggleMonth(year, monthYear)}>
                              {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)} {expandedMonths.get(year)?.has(monthYear) ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
                            </h4>
                            {expandedMonths.get(year)?.has(monthYear) && (
                              <div className="capsules-grid"> {/* Reutiliza a classe de grid para os cards */}
                                {groupedCapsules[year][monthYear].map((capsule) => (
                                  <div
                                    key={capsule.id}
                                    className="capsule-card card-base interactive-card"
                                  >
                                    <div onClick={() => handleCapsuleClick(capsule)}
                                         className="capsule-card-content">
                                      <div className="capsule-card-header">
                                        <h3 className="capsule-title">{capsule.title}</h3>
                                        {capsule.mood && (
                                          <div className="capsule-mood">
                                            <span className="capsule-mood-emoji">{capsule.mood.emoji}</span>
                                            <span className="capsule-mood-name">{capsule.mood.name}</span>
                                          </div>
                                        )}
                                      </div>
                                      {capsule.description && (
                                        <div className="capsule-description" dangerouslySetInnerHTML={{ __html: getHtmlSummary(capsule.description, 150) }} />
                                      )}
                                      {capsule.tags && capsule.tags.length > 0 && (
                                        <div className="capsule-tags-container">
                                          {capsule.tags.map((tag) => (
                                            <span key={tag.id} className="tag-item">#{tag.name}</span>
                                          ))}
                                        </div>
                                      )}
                                      <div className="capsule-meta">
                                        <span>📅 {formatDate(capsule.capsule_date)}</span>
                                        {capsule.location && <span>📍 {capsule.location}</span>}
                                        {capsule.media_files && capsule.media_files.length > 0 && (
                                            <span className="capsule-media-indicators">
                                                {hasMediaType(capsule, 'image') && (
                                                    <span title="Contém Imagem" className="media-indicator media-indicator-image">
                                                        <FaCamera /> Imagem
                                                    </span>
                                                )}
                                                {hasMediaType(capsule, 'audio') && (
                                                    <span title="Contém Áudio" className="media-indicator media-indicator-audio">
                                                        <FaVolumeUp /> Áudio
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="capsule-actions">
                                      <button onClick={(e) => handleEditCapsule(capsule.id, e)} className="action-button edit-button">
                                        <FiEdit size={16} /> Editar
                                      </button>
                                      <button onClick={(e) => handleDeleteCapsule(capsule.id, e)} className="action-button delete-button">
                                        <FiTrash2 size={16} /> Excluir
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </main>

      {isModalOpen && selectedCapsule && (
        <CapsuleModal
          capsule={selectedCapsule}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}

      {/* NOVO BLOCO <style jsx> PARA ESTILOS ESPECÍFICOS DESTA PÁGINA */}
      <style jsx>{`
        /* Estilos para o contêiner do cabeçalho da página (título + botão Nova Cápsula) */
        .page-header {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          margin-top: 1.5rem;
        }

        .page-header .page-header-title {
          color: #2d3748;
          margin: 0;
          font-size: 1.3rem;
          text-align: center;
        }

        /* Estilos para o agrupamento de anos e meses */
        .capsules-grouped-container {
            margin-top: 2rem;
        }

        .year-group-section, .month-group-section {
            background-color: var(--bg-white); /* Fundo claro para as seções */
            border-radius: 8px;
            margin-bottom: 1.5rem;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .year-header, .month-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.8rem 1rem;
            margin: -1rem; /* Ajusta a margem para cobrir o padding do pai */
            margin-bottom: 0;
            cursor: pointer;
            font-weight: 600;
            border-radius: 8px;
            transition: background-color 0.2s ease;
        }

        .year-header {
            font-size: 1.8rem;
            color: var(--color-primary);
            background-color: var(--accent-light);
            margin-bottom: 1rem;
        }
        .year-header:hover {
            background-color: var(--accent-hover);
        }

        .month-header {
            font-size: 1.2rem;
            color: var(--text-color-dark);
            background-color: var(--background-lighter);
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        .month-header:hover {
            background-color: var(--background-hover);
        }

        .chevron-icon {
            font-size: 1.2rem;
            color: var(--color-secondary);
        }

        /* Estilos para o grid de cápsulas (já existente, só garantindo que se encaixa) */
        .capsules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .capsule-card {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            min-height: 250px; /* Garante altura mínima para os cards */
        }
        .capsule-card-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            padding: 1rem;
            padding-bottom: 0; /* Ações tem padding próprio */
        }
        .capsule-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }
        .capsule-title {
            font-size: 1.1rem;
            color: var(--text-color-dark);
            margin: 0;
            flex-grow: 1;
            margin-right: 0.5rem;
        }
        .capsule-mood {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            background-color: var(--mood-background);
            border-radius: 4px;
            padding: 0.2rem 0.5rem;
            font-size: 0.8rem;
            color: var(--mood-text);
            white-space: nowrap;
        }
        .capsule-mood-emoji {
            font-size: 1rem;
        }
        .capsule-description {
            font-size: 0.9rem;
            color: var(--text-color-light);
            margin-bottom: 0.75rem;
            line-height: 1.4;
            max-height: 70px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .capsule-tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        .tag-item {
            background-color: var(--tag-background);
            color: var(--tag-text);
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.75rem;
            white-space: nowrap;
        }
        .capsule-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            font-size: 0.8rem;
            color: var(--text-color-medium);
            margin-top: 0.5rem;
        }
        .capsule-media-indicators {
            display: flex;
            gap: 0.5rem;
            margin-left: auto;
        }
        .media-indicator {
            display: flex;
            align-items: center;
            gap: 0.2rem;
            font-size: 0.75rem;
            color: var(--color-primary);
        }

        .capsule-actions {
            display: flex;
            gap: 0.5rem;
            padding: 0.75rem 1rem 1rem 1rem;
            border-top: 1px solid var(--border-color);
            margin-top: 1rem; /* Espaçamento entre o conteúdo e as ações */
        }
        .action-button {
            flex-grow: 1;
            padding: 0.6rem 0.8rem;
            border-radius: 6px;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .edit-button {
            background-color: var(--button-secondary-bg);
            color: var(--button-secondary-text);
            border: 1px solid var(--button-secondary-border);
        }
        .edit-button:hover {
            background-color: var(--button-secondary-hover-bg);
        }
        .delete-button {
            background-color: var(--button-danger-bg);
            color: var(--button-danger-text);
            border: none;
        }
        .delete-button:hover {
            background-color: var(--button-danger-hover-bg);
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .page-header {
            margin-bottom: 1.5rem;
            margin-top: 1rem;
          }
          .page-header .page-header-title {
            font-size: 1.3rem;
          }
          .filters-grid {
              grid-template-columns: 1fr; /* Uma coluna em mobile */
          }
          .filter-group {
              margin-bottom: 0.75rem; /* Espaçamento entre os filtros */
          }
          .filter-group:last-child {
              margin-bottom: 0;
          }
          .capsules-grid {
              grid-template-columns: 1fr; /* Uma coluna em mobile */
          }

          .year-header {
            font-size: 1.5rem;
          }
          .month-header {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CapsulesPage;